import type { EntitlementFeature } from '../billing/entitlements'
import { getBackgroundJobLimits } from '../billing/entitlements'
import { assertEntitlementForUser } from '../billing/entitlementsUser'
import { resolveUserPlanName } from '../billing/usageDb'
import type { ApiErrorKey } from '../i18n/apiMessages'
import { localizedErrorResponse } from './localizedError'

export const ENTITLEMENT_API_ERROR_KEYS: Record<EntitlementFeature, ApiErrorKey> = {
  allModelTiers: 'api.entitlement.allModelTiers',
  autopilotUnlimited: 'api.entitlement.autopilot',
  intentFullLinkage: 'api.entitlement.intentLinkage',
  proofHtmlExport: 'api.entitlement.proofHtml',
  weeklyRecapExport: 'api.entitlement.weeklyRecap',
  intentShareImport: 'api.entitlement.intentShare',
  collabHost: 'api.entitlement.collabHost',
  shareProgressComments: 'api.entitlement.shareProgressComments',
  shareProgressWatch: 'api.entitlement.shareProgressWatch',
  fullSessionResume: 'api.entitlement.fullSessionResume',
  fullLinkageCommands: 'api.entitlement.intentLinkage',
}

/**
 * Returns a 403 response when the user lacks the feature, or null when allowed.
 */
export async function requireEntitlementForUser(
  req: Request,
  userId: string,
  feature: EntitlementFeature,
): Promise<Response | null> {
  const check = await assertEntitlementForUser(userId, feature)
  if (check.ok) return null

  const key = ENTITLEMENT_API_ERROR_KEYS[feature]
  return localizedErrorResponse(req, key, 403, {
    feature: check.feature,
    requiredPlan: check.requiredPlan,
  })
}

/** Plan batch queue (backgroundJobsBatchMax > 0). */
export async function requireBackgroundBatchForUser(
  req: Request,
  userId: string,
): Promise<Response | null> {
  const planName = await resolveUserPlanName(userId)
  if (getBackgroundJobLimits(planName).batchMax > 0) return null
  return localizedErrorResponse(req, 'api.job.batchRequiresUpgrade', 403)
}
