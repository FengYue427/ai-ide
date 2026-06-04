import { isQuotaNearLimit, quotaUsagePercent } from './quotaUsageHints'
import { estimatePlatformCostUsd, getPlatformCostPerRequestUsd } from './platformUsageEstimate'
import type { QuotaSnapshot, UsageDayBucket } from './usageDb'

export interface PlatformUsageDashboardPayload {
  source: 'server'
  quota: QuotaSnapshot
  platformToday: number
  otherToday: number
  costEstimateTodayUsd: number
  costPerRequestUsd: number
  periodDays: number
  daily: UsageDayBucket[]
  platformPeriodTotal: number
  costEstimatePeriodUsd: number
  quotaUsagePercent: number
  quotaNearLimit: boolean
  /** Platform gateway model route (read-only). */
  platformProvider?: string
}

export function buildPlatformUsageDashboard(params: {
  quota: QuotaSnapshot
  platformToday: number
  otherToday: number
  daily: UsageDayBucket[]
  periodDays: number
  platformProvider?: string
}): PlatformUsageDashboardPayload {
  const platformPeriodTotal = params.daily.reduce((sum, row) => sum + row.platform, 0)
  const usagePercent = quotaUsagePercent(params.quota.used, params.quota.limit)
  return {
    source: 'server',
    quota: params.quota,
    platformToday: params.platformToday,
    otherToday: params.otherToday,
    costEstimateTodayUsd: estimatePlatformCostUsd(params.platformToday),
    costPerRequestUsd: getPlatformCostPerRequestUsd(),
    periodDays: params.periodDays,
    daily: params.daily,
    platformPeriodTotal,
    costEstimatePeriodUsd: estimatePlatformCostUsd(platformPeriodTotal),
    quotaUsagePercent: usagePercent,
    quotaNearLimit: isQuotaNearLimit(params.quota.used, params.quota.limit),
    platformProvider: params.platformProvider,
  }
}
