import type { EntitlementFeature } from '../../lib/billing/entitlements'
import type { TranslationKey } from '../i18n'
import type { ConversionSource } from './conversionTracking'

/** Non-feature upgrade surfaces (batch queue, etc.) */
export type UpgradeContext = EntitlementFeature | 'planBatch'

export const ENTITLEMENT_UPGRADE_MESSAGE_KEYS: Record<UpgradeContext, TranslationKey> = {
  allModelTiers: 'entitlements.upgrade.allModelTiers',
  autopilotUnlimited: 'entitlements.upgrade.autopilot',
  intentFullLinkage: 'entitlements.upgrade.intentLinkage',
  proofHtmlExport: 'entitlements.upgrade.proofHtml',
  weeklyRecapExport: 'entitlements.upgrade.weeklyRecap',
  intentShareImport: 'entitlements.upgrade.intentShare',
  collabHost: 'entitlements.upgrade.collabHost',
  shareProgressComments: 'entitlements.upgrade.shareProgressComments',
  shareProgressWatch: 'entitlements.upgrade.shareProgressWatch',
  fullSessionResume: 'entitlements.upgrade.fullSessionResume',
  fullLinkageCommands: 'entitlements.upgrade.intentLinkage',
  planBatch: 'entitlements.upgrade.planBatch',
}

export const ENTITLEMENT_UPGRADE_SOURCES: Record<UpgradeContext, ConversionSource> = {
  allModelTiers: 'settings',
  autopilotUnlimited: 'autopilot',
  intentFullLinkage: 'upgrade-hint',
  proofHtmlExport: 'upgrade-hint',
  weeklyRecapExport: 'upgrade-hint',
  intentShareImport: 'share',
  collabHost: 'upgrade-hint',
  shareProgressComments: 'share',
  shareProgressWatch: 'share',
  fullSessionResume: 'settings',
  fullLinkageCommands: 'upgrade-hint',
  planBatch: 'plan-batch',
}

export function getEntitlementUpgradeMessageKey(context: UpgradeContext): TranslationKey {
  return ENTITLEMENT_UPGRADE_MESSAGE_KEYS[context]
}

export function getEntitlementUpgradeSource(context: UpgradeContext): ConversionSource {
  return ENTITLEMENT_UPGRADE_SOURCES[context]
}
