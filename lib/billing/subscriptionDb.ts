import type { Prisma } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import { prismaUpsert, type UpsertDelegate } from './prismaUpsert'
import { BILLING_PLANS } from './plans'
import { mapStripeSubscriptionStatus } from './stripeStatus'

export type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{ include: { plan: true } }>

export async function ensurePlansSeeded(): Promise<void> {
  for (const plan of BILLING_PLANS) {
    const payload = {
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      features: JSON.stringify(plan.features),
      limits: JSON.stringify(plan.limits),
      isActive: true,
    }
    await prismaUpsert({
      delegate: prisma.plan as unknown as UpsertDelegate<{ name: string }>,
      where: { name: plan.name },
      create: { name: plan.name, ...payload },
      update: payload,
    })
  }
}

export type SubscriptionExternalIds = {
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  paddleCustomerId?: string
  paddleSubscriptionId?: string
}

const DEFAULT_BILLING_DAYS = 30

/** Extend from current period end when renewing; fresh window for new subscriptions. */
export function computeSubscriptionPeriod(
  existing: { plan: { name: string }; currentPeriodStart: Date; currentPeriodEnd: Date } | null,
  extendDays = DEFAULT_BILLING_DAYS,
  now = new Date(),
): { currentPeriodStart: Date; currentPeriodEnd: Date } {
  if (!existing || existing.plan.name === 'free') {
    const end = new Date(now)
    end.setDate(end.getDate() + extendDays)
    return { currentPeriodStart: now, currentPeriodEnd: end }
  }

  const base = existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now
  const end = new Date(base)
  end.setDate(end.getDate() + extendDays)
  return { currentPeriodStart: existing.currentPeriodStart, currentPeriodEnd: end }
}

export async function upsertUserSubscription(
  userId: string,
  planName: string,
  externalIds?: SubscriptionExternalIds,
): Promise<SubscriptionWithPlan> {
  await ensurePlansSeeded()

  const plan = await prisma.plan.findUnique({ where: { name: planName } })
  if (!plan) {
    throw new Error(`未知计划: ${planName}`)
  }

  const existing = await getUserSubscription(userId)
  const { currentPeriodStart, currentPeriodEnd } = computeSubscriptionPeriod(existing)

  const payload = {
    planId: plan.id,
    status: 'active' as const,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: externalIds?.stripeCustomerId,
    stripeSubscriptionId: externalIds?.stripeSubscriptionId,
    paddleCustomerId: externalIds?.paddleCustomerId,
    paddleSubscriptionId: externalIds?.paddleSubscriptionId,
  }

  return prismaUpsert<SubscriptionWithPlan>({
    delegate: prisma.subscription as unknown as UpsertDelegate<SubscriptionWithPlan>,
    where: { userId },
    create: { userId, ...payload },
    update: payload,
    include: { plan: true },
  })
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })
}

async function reloadSubscriptionWithPlan(userId: string): Promise<SubscriptionWithPlan> {
  return prisma.subscription.findUniqueOrThrow({
    where: { userId },
    include: { plan: true },
  })
}

/** Mark paid subscription to end at current period (keeps access until period end). */
export async function scheduleSubscriptionCancel(userId: string) {
  const record = await getUserSubscription(userId)
  if (!record || record.plan.name === 'free') {
    throw new Error('当前没有可取消的付费订阅')
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      status: 'active',
    },
  })
  return reloadSubscriptionWithPlan(userId)
}

/** Remove paid subscription record — API falls back to free tier. */
export async function downgradeUserToFree(userId: string) {
  await prisma.subscription.deleteMany({ where: { userId } })
}

export async function clearSubscriptionCancelFlag(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  })
  return reloadSubscriptionWithPlan(userId)
}

export async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
  return prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { plan: true },
  })
}

/** Sync Prisma subscription from a Stripe Subscription object. */
export async function syncSubscriptionFromStripe(stripeSub: {
  id: string
  status: string
  cancel_at_period_end: boolean
  current_period_start: number
  current_period_end: number
  metadata?: Record<string, string> | null
  customer?: string | { id?: string } | null
}) {
  const userId = stripeSub.metadata?.userId
  const planName = stripeSub.metadata?.planName

  let record = userId ? await getUserSubscription(userId) : null
  if (!record) {
    record = await findSubscriptionByStripeId(stripeSub.id)
  }
  if (!record) {
    if (userId && planName) {
      return upsertUserSubscription(userId, planName, {
        stripeCustomerId:
          typeof stripeSub.customer === 'string'
            ? stripeSub.customer
            : stripeSub.customer?.id,
        stripeSubscriptionId: stripeSub.id,
      })
    }
    return null
  }

  if (stripeSub.status === 'canceled' || stripeSub.status === 'incomplete_expired') {
    await downgradeUserToFree(record.userId)
    return null
  }

  const targetPlanName = planName || record.plan.name
  const plan = await prisma.plan.findUnique({ where: { name: targetPlanName } })
  if (!plan) {
    throw new Error(`未知计划: ${targetPlanName}`)
  }

  await prisma.subscription.update({
    where: { userId: record.userId },
    data: {
      planId: plan.id,
      status: mapStripeSubscriptionStatus(stripeSub.status),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId:
        typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer?.id ?? record.stripeCustomerId,
    },
  })
  return reloadSubscriptionWithPlan(record.userId)
}

export async function findSubscriptionByPaddleId(paddleSubscriptionId: string) {
  return prisma.subscription.findFirst({
    where: { paddleSubscriptionId },
    include: { plan: true },
  })
}

/** Apply Paddle Billing subscription payload to our Subscription row. */
export async function syncSubscriptionFromPaddle(paddleSub: Record<string, unknown>) {
  const customRaw = paddleSub.custom_data
  const custom =
    customRaw && typeof customRaw === 'object' ? (customRaw as Record<string, unknown>) : {}
  const userId = typeof custom.userId === 'string' ? custom.userId : undefined
  const planName = typeof custom.planName === 'string' ? custom.planName : undefined
  const subscriptionId = typeof paddleSub.id === 'string' ? paddleSub.id : undefined
  const customerId = typeof paddleSub.customer_id === 'string' ? paddleSub.customer_id : undefined
  const status = typeof paddleSub.status === 'string' ? paddleSub.status : ''

  let record = userId ? await getUserSubscription(userId) : null
  if (!record && subscriptionId) {
    record = await findSubscriptionByPaddleId(subscriptionId)
  }

  if (status === 'canceled') {
    if (record) await downgradeUserToFree(record.userId)
    return null
  }

  const targetUserId = userId ?? record?.userId
  const targetPlan = planName ?? record?.plan.name
  if (!targetUserId || !targetPlan) return null

  await upsertUserSubscription(targetUserId, targetPlan, {
    paddleCustomerId: customerId ?? record?.paddleCustomerId ?? undefined,
    paddleSubscriptionId: subscriptionId ?? record?.paddleSubscriptionId ?? undefined,
  })

  const period = paddleSub.current_billing_period
  const periodData: { currentPeriodStart?: Date; currentPeriodEnd?: Date } = {}
  if (period && typeof period === 'object') {
    const p = period as Record<string, unknown>
    if (typeof p.starts_at === 'string') periodData.currentPeriodStart = new Date(p.starts_at)
    if (typeof p.ends_at === 'string') periodData.currentPeriodEnd = new Date(p.ends_at)
  }

  await prisma.subscription.update({
    where: { userId: targetUserId },
    data: {
      ...periodData,
      status: status === 'past_due' ? 'past_due' : 'active',
      cancelAtPeriodEnd: status === 'paused',
    },
  })

  return reloadSubscriptionWithPlan(targetUserId)
}

export async function markSubscriptionPastDueByStripeSubscriptionId(
  stripeSubscriptionId: string,
) {
  const record = await findSubscriptionByStripeId(stripeSubscriptionId)
  if (!record) return null

  await prisma.subscription.update({
    where: { userId: record.userId },
    data: { status: 'past_due' },
  })
  return reloadSubscriptionWithPlan(record.userId)
}
