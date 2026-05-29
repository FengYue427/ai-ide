import { prisma } from '../../src/lib/prisma'
import type { ApiMessageKey } from '../i18n/apiMessages'

/** Free: background Agent allowed with tight caps (v1.1.2 F4). */
export const FREE_BACKGROUND_JOBS_PER_DAY = 2
export const FREE_BACKGROUND_JOBS_MAX_ACTIVE = 1

/** Pro / Enterprise — generous caps. */
export const PAID_BACKGROUND_JOBS_PER_DAY = 100
export const PAID_BACKGROUND_JOBS_MAX_ACTIVE = 5

export type BackgroundJobEntitlementError = {
  key: ApiMessageKey
  params?: Record<string, string | number>
}

function startOfUtcDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function isPaidPlan(planName: string): boolean {
  return planName === 'pro' || planName === 'enterprise'
}

export async function countBackgroundJobsCreatedToday(userId: string): Promise<number> {
  const since = startOfUtcDay()
  return prisma.backgroundJob.count({
    where: { userId, createdAt: { gte: since } },
  })
}

export async function countActiveBackgroundJobs(userId: string): Promise<number> {
  return prisma.backgroundJob.count({
    where: { userId, status: { in: ['queued', 'running'] } },
  })
}

export function backgroundJobDailyLimit(planName: string): number {
  return isPaidPlan(planName) ? PAID_BACKGROUND_JOBS_PER_DAY : FREE_BACKGROUND_JOBS_PER_DAY
}

export function backgroundJobMaxActive(planName: string): number {
  return isPaidPlan(planName) ? PAID_BACKGROUND_JOBS_MAX_ACTIVE : FREE_BACKGROUND_JOBS_MAX_ACTIVE
}

export async function assertCanCreateBackgroundJob(
  userId: string,
  planName: string,
): Promise<{ ok: true } | { ok: false; error: BackgroundJobEntitlementError }> {
  const dailyLimit = backgroundJobDailyLimit(planName)
  const maxActive = backgroundJobMaxActive(planName)

  const [createdToday, active] = await Promise.all([
    countBackgroundJobsCreatedToday(userId),
    countActiveBackgroundJobs(userId),
  ])

  if (createdToday >= dailyLimit) {
    return {
      ok: false,
      error: {
        key: isPaidPlan(planName) ? 'api.job.dailyLimit' : 'api.job.dailyLimitUpgrade',
        params: { limit: dailyLimit, plan: planName },
      },
    }
  }

  if (active >= maxActive) {
    return {
      ok: false,
      error: {
        key: isPaidPlan(planName) ? 'api.job.concurrentLimit' : 'api.job.concurrentLimitUpgrade',
        params: { limit: maxActive },
      },
    }
  }

  return { ok: true }
}

/** How many more jobs the user can create today (0 if at daily cap). */
export async function remainingBackgroundJobsToday(
  userId: string,
  planName: string,
): Promise<number> {
  const dailyLimit = backgroundJobDailyLimit(planName)
  const createdToday = await countBackgroundJobsCreatedToday(userId)
  return Math.max(0, dailyLimit - createdToday)
}
