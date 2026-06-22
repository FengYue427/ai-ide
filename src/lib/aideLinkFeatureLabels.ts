import type { TranslationKey } from '../i18n'

/** Maps aideLink payload `feature` ids to readable i18n labels. */
export const AIDE_LINK_FEATURE_LABEL_KEYS: Record<string, TranslationKey> = {
  aiQuota: 'settings.ai.nearLimit.aiQuota',
  autopilot: 'entitlements.feature.autopilotUnlimited',
  autopilotUnlimited: 'entitlements.feature.autopilotUnlimited',
  proofHtmlExport: 'entitlements.feature.proofHtmlExport',
  weeklyRecapExport: 'entitlements.feature.weeklyRecapExport',
  intentShareImport: 'entitlements.feature.intentShareImport',
  collabHost: 'entitlements.feature.collabHost',
  shareProgressComments: 'entitlements.feature.shareProgressComments',
  intentFullLinkage: 'entitlements.feature.intentFullLinkage',
  allModelTiers: 'entitlements.feature.allModelTiers',
  backgroundJobs: 'settings.ai.nearLimit.backgroundJobs',
  shares: 'settings.ai.nearLimit.shares',
  workspaces: 'settings.ai.nearLimit.workspaces',
}

export function resolveAideLinkFeatureLabel(
  feature: string,
  t: (key: TranslationKey, params?: Record<string, string>) => string,
): string {
  const key = AIDE_LINK_FEATURE_LABEL_KEYS[feature]
  return key ? t(key) : feature
}
