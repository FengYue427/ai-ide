import type { QuotaCheck } from './aiService'
import { apiFetch, readJsonResponse } from './apiUtils'

export type UsageEntitlementsPayload = {
  plan: string
  unlocked: string[]
  locked: string[]
  nearLimits: Array<{
    id: 'aiQuota' | 'autopilot' | 'backgroundJobs' | 'shares' | 'workspaces'
    used: number
    limit: number
    percent: number
  }>
}

export type UsageDayBucket = {
  date: string
  platform: number
  other: number
  total: number
}

export type PlatformUsageDashboard = {
  source: 'server'
  quota: QuotaCheck
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
  platformProvider?: string
  entitlements?: UsageEntitlementsPayload
}

export async function fetchPlatformUsageDashboard(
  signal?: AbortSignal,
): Promise<PlatformUsageDashboard | null> {
  try {
    const response = await apiFetch('/api/usage/dashboard', {
      credentials: 'include',
      signal,
    })
    const data = await readJsonResponse<PlatformUsageDashboard>(response)
    if (!response.ok || !data?.quota) return null
    return data
  } catch {
    return null
  }
}
