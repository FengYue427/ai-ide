import { isQuotaNearLimit } from '../../lib/billing/quotaUsageHints'
import { emitAideLinkEvent } from './aideLinkBus'
import type { QuotaCheck } from '../services/aiService'

const NEAR_LIMIT_SESSION_KEY = 'aide-quota-near-warned'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readNearLimitWarned(): string | null {
  try {
    return sessionStorage.getItem(NEAR_LIMIT_SESSION_KEY)
  } catch {
    return null
  }
}

function markNearLimitWarned(): void {
  try {
    sessionStorage.setItem(NEAR_LIMIT_SESSION_KEY, todayKey())
  } catch {
    // ignore
  }
}

/** Activity Line hint when AI quota crosses 80% (once per session day). */
export function maybeEmitQuotaNearLimit(quota: QuotaCheck): void {
  if (!isQuotaNearLimit(quota.used, quota.limit)) return
  if (readNearLimitWarned() === todayKey()) return
  markNearLimitWarned()
  const percent = quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 100
  emitAideLinkEvent('quota-exceeded', {
    feature: 'aiQuota',
    used: String(quota.used),
    limit: String(quota.limit),
    percent: String(percent),
    nearLimit: 'true',
  })
}

/** Activity Line hint when AI request is blocked by hard quota. */
export function emitQuotaBlocked(quota: QuotaCheck): void {
  emitAideLinkEvent('quota-exceeded', {
    feature: 'aiQuota',
    used: String(quota.used),
    limit: String(quota.limit),
    blocked: 'true',
  })
}
