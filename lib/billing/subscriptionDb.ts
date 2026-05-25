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

export async function upsertUserSubscription(
  userId: string,
  planName: string,
  stripeIds?: {
    customerId?: string
    subscriptionId?: string
  },
): Promise<SubscriptionWithPlan> {
  await ensurePlansSeeded()

  const plan = await prisma.plan.findUnique({ where: { name: planName } })
  if (!plan) {
    throw new Error(`未知计划: ${planName}`)
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + 30)

  const payload = {
    planId: plan.id,
    status: 'active' as const,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: stripeIds?.customerId,
    stripeSubscriptionId: stripeIds?.subscriptionId,
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
        customerId:
          typeof stripeSub.customer === 'string'
            ? stripeSub.customer
            : stripeSub.customer?.id,
        subscriptionId: stripeSub.id,
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
