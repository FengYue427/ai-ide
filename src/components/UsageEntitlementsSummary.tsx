import type { EntitlementFeature } from '../../lib/billing/entitlements'
import { useI18n, type TranslationKey } from '../i18n'
import type { UsageEntitlementsPayload } from '../services/platformUsageDashboardService'

const FEATURE_LABEL_KEYS: Partial<Record<EntitlementFeature, TranslationKey>> = {
  autopilotUnlimited: 'entitlements.feature.autopilotUnlimited',
  proofHtmlExport: 'entitlements.feature.proofHtmlExport',
  weeklyRecapExport: 'entitlements.feature.weeklyRecapExport',
  intentShareImport: 'entitlements.feature.intentShareImport',
  collabHost: 'entitlements.feature.collabHost',
  shareProgressComments: 'entitlements.feature.shareProgressComments',
  intentFullLinkage: 'entitlements.feature.intentFullLinkage',
  allModelTiers: 'entitlements.feature.allModelTiers',
}

const NEAR_LIMIT_LABEL_KEYS: Record<
  UsageEntitlementsPayload['nearLimits'][number]['id'],
  TranslationKey
> = {
  aiQuota: 'settings.ai.nearLimit.aiQuota',
  autopilot: 'settings.ai.nearLimit.autopilot',
  backgroundJobs: 'settings.ai.nearLimit.backgroundJobs',
  shares: 'settings.ai.nearLimit.shares',
  workspaces: 'settings.ai.nearLimit.workspaces',
}

interface UsageEntitlementsSummaryProps {
  entitlements: UsageEntitlementsPayload
  onUpgrade?: () => void
}

export function UsageEntitlementsSummary({ entitlements, onUpgrade }: UsageEntitlementsSummaryProps) {
  const { t } = useI18n()
  const lockedPreview = entitlements.locked.slice(0, 4)

  return (
    <div className="platform-usage-dashboard__entitlements" data-testid="usage-entitlements-summary">
      <p className="platform-usage-dashboard__entitlements-head">
        {t('settings.ai.dashboardUnlocked', { count: String(entitlements.unlocked.length) })}
        {entitlements.locked.length > 0
          ? ` · ${t('settings.ai.dashboardLocked', { count: String(entitlements.locked.length) })}`
          : ''}
      </p>
      {lockedPreview.length > 0 ? (
        <ul className="platform-usage-dashboard__entitlements-locked">
          {lockedPreview.map((feature) => {
            const labelKey = FEATURE_LABEL_KEYS[feature as EntitlementFeature]
            return (
              <li key={feature} className="platform-usage-dashboard__entitlements-locked-row">
                <span>{labelKey ? t(labelKey) : feature}</span>
                {onUpgrade ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    data-testid={`usage-entitlement-upgrade-${feature}`}
                    onClick={onUpgrade}
                  >
                    {t('entitlements.card.upgrade')}
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
      {entitlements.nearLimits.map((item) => (
        <div
          key={item.id}
          className="platform-usage-dashboard__quota-warn platform-usage-dashboard__quota-warn--row"
          role="status"
          data-testid={`usage-near-limit-${item.id}`}
        >
          <span>
            {t('settings.ai.dashboardNearLimit', {
              label: t(NEAR_LIMIT_LABEL_KEYS[item.id]),
              percent: String(item.percent),
              used: String(item.used),
              limit: String(item.limit),
            })}
          </span>
          {onUpgrade ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-testid={`usage-near-limit-upgrade-${item.id}`}
              onClick={onUpgrade}
            >
              {t('entitlements.card.upgrade')}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
