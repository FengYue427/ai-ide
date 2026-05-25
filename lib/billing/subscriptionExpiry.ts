import { prisma } from '../../src/lib/prisma'
import { downgradeUserToFree, getUserSubscription } from './subscriptionDb'

/** Grace period after `currentPeriodEnd` before downgrading to free (days). */
export const SUBSCRIPTION_GRACE_DAYS = 3

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function periodEndWithGrace(periodEnd: Date, graceDays = SUBSCRIPTION_GRACE_DAYS): Date {
  return new Date(periodEnd.getTime() + graceDays * MS_PER_DAY)
}

/** Paid subscription is past period end + grace — should downgrade to free. */
export function shouldExpireSubscription(
  record: { plan: { name: string }; currentPeriodEnd: Date },
  now = new Date(),
): boolean {
  if (record.plan.name === 'free') return false
  return periodEndWithGrace(record.currentPeriodEnd) <= now
}

export async function expireUserSubscriptionIfDue(userId: string): Promise<{ expired: boolean }> {
  const record = await getUserSubscription(userId)
  if (!record || !shouldExpireSubscription(record)) {
    return { expired: false }
  }
  await downgradeUserToFree(userId)
  return { expired: true }
}

/**
 * Batch downgrade subscriptions past period end + grace.
 * Intended for Vercel cron (`POST /api/billing/expire-subscriptions`).
 */
export async function processExpiredSubscriptions(): Promise<{
  scanned: number
  expired: number
}> {
  const now = new Date()
  const graceCutoff = new Date(now.getTime() - SUBSCRIPTION_GRACE_DAYS * MS_PER_DAY)

  const candidates = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: { lt: graceCutoff },
      plan: { name: { not: 'free' } },
    },
    include: { plan: true },
  })

  let expired = 0
  for (const record of candidates) {
    if (!shouldExpireSubscription(record, now)) continue
    await downgradeUserToFree(record.userId)
    expired += 1
  }

  return { scanned: candidates.length, expired }
}
