import { getEffectiveEntitlements, type EntitlementFeature, type PlanEntitlements } from './entitlements'
import { assertEntitlementFeature } from './entitlements'
import { resolveUserPlanName } from './usageDb'
import type { AutopilotQuotaSnapshot } from './autopilotUsage'
import type { QuotaSnapshot } from './usageDb'

export type NearLimitItem = {
  id: 'aiQuota' | 'autopilot' | 'backgroundJobs' | 'shares' | 'workspaces'
  used: number
  limit: number
  percent: number
}

export type DashboardEntitlementsPayload = {
  plan: string
  unlocked: EntitlementFeature[]
  locked: EntitlementFeature[]
  nearLimits: NearLimitItem[]
}

const TRACKED_FEATURES: EntitlementFeature[] = [
  'autopilotUnlimited',
  'proofHtmlExport',
  'weeklyRecapExport',
  'intentShareImport',
  'collabHost',
  'shareProgressComments',
  'intentFullLinkage',
  'allModelTiers',
]

export function getCollabMaxParticipants(planName: string): number {
  return getEffectiveEntitlements(planName).collabMaxParticipants
}

export async function assertCanHostCollabRoom(
  userId: string,
): Promise<{ ok: true } | { ok: false; requiredPlan: 'pro' | 'enterprise' }> {
  const planName = await resolveUserPlanName(userId)
  const result = assertEntitlementFeature(planName, 'collabHost')
  if (result.ok) return { ok: true }
  return { ok: false, requiredPlan: result.requiredPlan }
}

export function buildDashboardEntitlements(
  planName: string,
  entitlements: PlanEntitlements,
  options?: {
    aiQuota?: QuotaSnapshot
    autopilotQuota?: AutopilotQuotaSnapshot
  },
): DashboardEntitlementsPayload {
  const unlocked: EntitlementFeature[] = []
  const locked: EntitlementFeature[] = []

  for (const feature of TRACKED_FEATURES) {
    if (entitlements.features[feature]) unlocked.push(feature)
    else locked.push(feature)
  }

  const nearLimits: NearLimitItem[] = []

  const aiQuota = options?.aiQuota
  if (aiQuota && aiQuota.limit > 0) {
    const percent = Math.round((aiQuota.used / aiQuota.limit) * 100)
    if (percent >= 80) {
      nearLimits.push({
        id: 'aiQuota',
        used: aiQuota.used,
        limit: aiQuota.limit,
        percent,
      })
    }
  }

  const autopilot = options?.autopilotQuota
  if (autopilot && !autopilot.unlimited && autopilot.limit > 0) {
    const percent = Math.round((autopilot.used / autopilot.limit) * 100)
    if (percent >= 80) {
      nearLimits.push({
        id: 'autopilot',
        used: autopilot.used,
        limit: autopilot.limit,
        percent,
      })
    }
  }

  if (entitlements.backgroundJobsPerDay > 0) {
    nearLimits.push({
      id: 'backgroundJobs',
      used: 0,
      limit: entitlements.backgroundJobsPerDay,
      percent: 0,
    })
  }

  return {
    plan: planName,
    unlocked,
    locked,
    nearLimits: nearLimits.filter((item) => item.id === 'aiQuota' || item.id === 'autopilot' || item.percent >= 80),
  }
}
