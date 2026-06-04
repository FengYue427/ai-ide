import type { Prisma } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import { prismaSupportsTransactions } from '../../src/lib/prismaTransactions'
import { findPlanByName, type PlanDefinition } from './plans'
import { effectivePlanName } from './publicWelfare'

export const AI_USAGE_TYPE = 'ai_request'

type DbClient = Prisma.TransactionClient | typeof prisma

function startOfUtcDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function getAiDailyLimit(planName: string): number {
  const effective = effectivePlanName(planName)
  return findPlanByName(effective)?.limits.aiRequestsPerDay ?? 200
}

async function resolveUserPlanNameTx(userId: string, db: DbClient): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })
  const name = subscription?.plan.name ?? 'free'
  return effectivePlanName(name)
}

export async function resolveUserPlanName(userId: string): Promise<string> {
  return resolveUserPlanNameTx(userId, prisma)
}

async function getAiUsageCountTodayTx(userId: string, db: DbClient): Promise<number> {
  const since = startOfUtcDay()
  const aggregate = await db.usageRecord.aggregate({
    where: {
      userId,
      type: AI_USAGE_TYPE,
      createdAt: { gte: since },
    },
    _sum: { amount: true },
  })
  return aggregate._sum.amount ?? 0
}

export async function getAiUsageCountToday(userId: string): Promise<number> {
  return getAiUsageCountTodayTx(userId, prisma)
}

export async function incrementAiUsage(userId: string, amount = 1): Promise<number> {
  await prisma.usageRecord.create({
    data: {
      userId,
      type: AI_USAGE_TYPE,
      amount,
    },
  })
  return getAiUsageCountToday(userId)
}

export type QuotaSnapshot = ReturnType<typeof buildQuotaSnapshot>

/** Record usage only when within daily plan limit (transactional read-check-write when supported). */
export async function consumeAiUsage(
  userId: string,
  amount = 1,
): Promise<{ ok: true; quota: QuotaSnapshot } | { ok: false; quota: QuotaSnapshot }> {
  if (!prismaSupportsTransactions()) {
    return consumeAiUsageSequential(userId, amount)
  }

  return prisma.$transaction(async (tx) => {
    const plan = await resolveUserPlanNameTx(userId, tx)
    const used = await getAiUsageCountTodayTx(userId, tx)
    const limit = getAiDailyLimit(plan)

    if (limit !== -1 && used + amount > limit) {
      return { ok: false as const, quota: buildQuotaSnapshot(plan, used) }
    }

    await tx.usageRecord.create({
      data: {
        userId,
        type: AI_USAGE_TYPE,
        amount,
      },
    })

    const newUsed = await getAiUsageCountTodayTx(userId, tx)
    return { ok: true as const, quota: buildQuotaSnapshot(plan, newUsed) }
  })
}

/** Neon HTTP: no `$transaction`; small race window on concurrent quota checks is acceptable for RC. */
async function consumeAiUsageSequential(
  userId: string,
  amount: number,
): Promise<{ ok: true; quota: QuotaSnapshot } | { ok: false; quota: QuotaSnapshot }> {
  const plan = await resolveUserPlanName(userId)
  const used = await getAiUsageCountToday(userId)
  const limit = getAiDailyLimit(plan)

  if (limit !== -1 && used + amount > limit) {
    return { ok: false as const, quota: buildQuotaSnapshot(plan, used) }
  }

  const newUsed = await incrementAiUsage(userId, amount)
  return { ok: true as const, quota: buildQuotaSnapshot(plan, newUsed) }
}

export function buildQuotaSnapshot(planName: string, used: number) {
  const limit = getAiDailyLimit(planName)
  if (limit === -1) {
    return {
      allowed: true,
      used,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      plan: planName,
    }
  }
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan: planName,
  }
}

export function planLimitsFromDefinition(plan: PlanDefinition) {
  return plan.limits
}
