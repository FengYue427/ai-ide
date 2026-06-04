import type { Prisma } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import { prismaSupportsTransactions } from '../../src/lib/prismaTransactions'
import { findPlanByName, type PlanDefinition } from './plans'
import { effectivePlanName } from './publicWelfare'

export const AI_USAGE_TYPE = 'ai_request'
/** Server-side platform gateway (`POST /api/ai/chat`, etc.) — counted toward daily quota. */
export const AI_USAGE_PLATFORM_TYPE = 'ai_platform_request'

const QUOTA_USAGE_TYPES = [AI_USAGE_TYPE, AI_USAGE_PLATFORM_TYPE] as const

export type UsageDayBucket = {
  /** UTC date YYYY-MM-DD */
  date: string
  platform: number
  other: number
  total: number
}

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

async function sumUsageAmountTx(
  userId: string,
  db: DbClient,
  types: readonly string[],
  since: Date,
  until?: Date,
): Promise<number> {
  const aggregate = await db.usageRecord.aggregate({
    where: {
      userId,
      type: { in: [...types] },
      createdAt: until ? { gte: since, lt: until } : { gte: since },
    },
    _sum: { amount: true },
  })
  return aggregate._sum.amount ?? 0
}

async function getAiUsageCountTodayTx(userId: string, db: DbClient): Promise<number> {
  return sumUsageAmountTx(userId, db, QUOTA_USAGE_TYPES, startOfUtcDay())
}

export async function getUsageCountForDay(
  userId: string,
  types: readonly string[],
  dayOffsetFromToday: number,
): Promise<number> {
  const now = new Date()
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffsetFromToday),
  )
  const dayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffsetFromToday + 1),
  )
  return sumUsageAmountTx(userId, prisma, types, dayStart, dayEnd)
}

/** Last N UTC days including today (oldest first). */
export async function getAiUsageDailyBuckets(userId: string, dayCount = 7): Promise<UsageDayBucket[]> {
  const safeDays = Math.min(Math.max(1, Math.floor(dayCount)), 31)
  const buckets: UsageDayBucket[] = []
  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const now = new Date()
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset),
    )
    const date = dayStart.toISOString().slice(0, 10)
    const platform = await getUsageCountForDay(userId, [AI_USAGE_PLATFORM_TYPE], offset)
    const other = await getUsageCountForDay(userId, [AI_USAGE_TYPE], offset)
    buckets.push({ date, platform, other, total: platform + other })
  }
  return buckets
}

export async function getAiUsageCountToday(userId: string): Promise<number> {
  return getAiUsageCountTodayTx(userId, prisma)
}

export type ConsumeAiUsageOptions = {
  /** Defaults to {@link AI_USAGE_TYPE}. Platform gateway should pass {@link AI_USAGE_PLATFORM_TYPE}. */
  usageType?: string
}

export async function incrementAiUsage(
  userId: string,
  amount = 1,
  usageType = AI_USAGE_TYPE,
): Promise<number> {
  await prisma.usageRecord.create({
    data: {
      userId,
      type: usageType,
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
  options?: ConsumeAiUsageOptions,
): Promise<{ ok: true; quota: QuotaSnapshot } | { ok: false; quota: QuotaSnapshot }> {
  const usageType = options?.usageType ?? AI_USAGE_TYPE
  if (!prismaSupportsTransactions()) {
    return consumeAiUsageSequential(userId, amount, usageType)
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
        type: usageType,
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
  usageType: string,
): Promise<{ ok: true; quota: QuotaSnapshot } | { ok: false; quota: QuotaSnapshot }> {
  const plan = await resolveUserPlanName(userId)
  const used = await getAiUsageCountToday(userId)
  const limit = getAiDailyLimit(plan)

  if (limit !== -1 && used + amount > limit) {
    return { ok: false as const, quota: buildQuotaSnapshot(plan, used) }
  }

  const newUsed = await incrementAiUsage(userId, amount, usageType)
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
