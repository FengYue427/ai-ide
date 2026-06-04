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
}

export function buildPlatformUsageDashboard(params: {
  quota: QuotaSnapshot
  platformToday: number
  otherToday: number
  daily: UsageDayBucket[]
  periodDays: number
}): PlatformUsageDashboardPayload {
  const platformPeriodTotal = params.daily.reduce((sum, row) => sum + row.platform, 0)
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
  }
}
