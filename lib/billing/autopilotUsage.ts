import { getEffectiveEntitlements } from './entitlements'
import { effectivePlanName } from './publicWelfare'
import { getUsageCountForDay, resolveUserPlanName } from './usageDb'
import { prisma } from '../../src/lib/prisma'
import { prismaSupportsTransactions } from '../../src/lib/prismaTransactions'
import type { Prisma } from '@prisma/client'

export const AUTOPILOT_USAGE_TYPE = 'autopilot_run'

export type AutopilotQuotaSnapshot = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  plan: string
  unlimited: boolean
}

function startOfUtcDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function getAutopilotDailyLimit(planName: string): number {
  return getEffectiveEntitlements(planName).autopilotRunsPerDay
}

export async function getAutopilotUsageCountToday(userId: string): Promise<number> {
  return getUsageCountForDay(userId, [AUTOPILOT_USAGE_TYPE], 0)
}

export function buildAutopilotQuotaSnapshot(planName: string, used: number): AutopilotQuotaSnapshot {
  const limit = getAutopilotDailyLimit(planName)
  if (limit < 0) {
    return {
      allowed: true,
      used,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      plan: planName,
      unlimited: true,
    }
  }
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan: planName,
    unlimited: false,
  }
}

type DbClient = Prisma.TransactionClient | typeof prisma

async function resolvePlanTx(userId: string, db: DbClient): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })
  return effectivePlanName(subscription?.plan.name ?? 'free')
}

async function countTodayTx(userId: string, db: DbClient): Promise<number> {
  const aggregate = await db.usageRecord.aggregate({
    where: {
      userId,
      type: AUTOPILOT_USAGE_TYPE,
      createdAt: { gte: startOfUtcDay() },
    },
    _sum: { amount: true },
  })
  return aggregate._sum.amount ?? 0
}

export async function getAutopilotQuotaForUser(userId: string): Promise<AutopilotQuotaSnapshot> {
  const plan = await resolveUserPlanName(userId)
  const used = await getAutopilotUsageCountToday(userId)
  return buildAutopilotQuotaSnapshot(plan, used)
}

export async function consumeAutopilotRun(
  userId: string,
): Promise<{ ok: true; quota: AutopilotQuotaSnapshot } | { ok: false; quota: AutopilotQuotaSnapshot }> {
  if (!prismaSupportsTransactions()) {
    return consumeAutopilotRunSequential(userId)
  }

  return prisma.$transaction(async (tx) => {
    const plan = await resolvePlanTx(userId, tx)
    const used = await countTodayTx(userId, tx)
    const limit = getAutopilotDailyLimit(plan)

    if (limit >= 0 && used + 1 > limit) {
      return { ok: false as const, quota: buildAutopilotQuotaSnapshot(plan, used) }
    }

    await tx.usageRecord.create({
      data: { userId, type: AUTOPILOT_USAGE_TYPE, amount: 1 },
    })

    const newUsed = await countTodayTx(userId, tx)
    return { ok: true as const, quota: buildAutopilotQuotaSnapshot(plan, newUsed) }
  })
}

async function consumeAutopilotRunSequential(
  userId: string,
): Promise<{ ok: true; quota: AutopilotQuotaSnapshot } | { ok: false; quota: AutopilotQuotaSnapshot }> {
  const plan = await resolveUserPlanName(userId)
  const used = await getAutopilotUsageCountToday(userId)
  const limit = getAutopilotDailyLimit(plan)

  if (limit >= 0 && used + 1 > limit) {
    return { ok: false as const, quota: buildAutopilotQuotaSnapshot(plan, used) }
  }

  await prisma.usageRecord.create({
    data: { userId, type: AUTOPILOT_USAGE_TYPE, amount: 1 },
  })

  const newUsed = await getAutopilotUsageCountToday(userId)
  return { ok: true as const, quota: buildAutopilotQuotaSnapshot(plan, newUsed) }
}
