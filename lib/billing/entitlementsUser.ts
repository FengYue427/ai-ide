import { resolveUserPlanName } from './usageDb'
import {
  assertEntitlementFeature,
  type EntitlementFeature,
} from './entitlements'

export async function assertEntitlementForUser(
  userId: string,
  feature: EntitlementFeature,
): Promise<
  { ok: true } | { ok: false; requiredPlan: 'pro' | 'enterprise'; feature: EntitlementFeature }
> {
  const planName = await resolveUserPlanName(userId)
  return assertEntitlementFeature(planName, feature)
}
