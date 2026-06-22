import type { EntitlementFeature } from '../../lib/billing/entitlements'
import { isTierCEnabled, type TierCFlag } from './intentOsTierC'
import { subscriptionService } from '../services/subscriptionService'

const TIER_C_ENTITLEMENT: Partial<Record<TierCFlag, EntitlementFeature>> = {
  intentShareImport: 'intentShareImport',
  intentGraphV2: 'intentFullLinkage',
  driftResolution: 'intentFullLinkage',
  intentReplay: 'intentFullLinkage',
  groundingGateV2: 'intentFullLinkage',
}

/** Env flag + subscription gate for Tier C features. */
export function isPlanGatedTierCEnabled(flag: TierCFlag): boolean {
  if (!isTierCEnabled(flag)) return false
  const feature = TIER_C_ENTITLEMENT[flag]
  if (!feature) return true
  return subscriptionService.canUseFeature(feature)
}

/** True when Tier C feature exists but Intent linkage requires Pro+. */
export function isIntentLinkageLocked(): boolean {
  return !subscriptionService.canUseFeature('intentFullLinkage')
}

/** Tier C flag is on but subscription blocks the linked entitlement. */
export function isTierCFeatureLocked(flag: TierCFlag): boolean {
  if (!isTierCEnabled(flag)) return true
  const feature = TIER_C_ENTITLEMENT[flag]
  if (!feature) return false
  return !subscriptionService.canUseFeature(feature)
}

export function canUseEntitlement(feature: EntitlementFeature): boolean {
  return subscriptionService.canUseFeature(feature)
}
