import { Crown } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'
import { trackUpgradeClick, type ConversionSource } from '../lib/conversionTracking'
import {
  getEntitlementUpgradeMessageKey,
  getEntitlementUpgradeSource,
  type UpgradeContext,
} from '../lib/entitlementUpgradeMessages'

interface UpgradeEntitlementHintProps {
  messageKey?: TranslationKey
  feature?: UpgradeContext
  onUpgrade?: () => void
  upgradeSource?: ConversionSource
  compact?: boolean
}

export function UpgradeEntitlementHint({
  messageKey,
  feature,
  onUpgrade,
  upgradeSource,
  compact = false,
}: UpgradeEntitlementHintProps) {
  const { t } = useI18n()
  const resolvedKey = messageKey ?? (feature ? getEntitlementUpgradeMessageKey(feature) : undefined)
  const resolvedSource =
    upgradeSource ?? (feature ? getEntitlementUpgradeSource(feature) : 'upgrade-hint')

  if (!resolvedKey) return null

  return (
    <div
      className={`upgrade-entitlement-hint${compact ? ' upgrade-entitlement-hint--compact' : ''}`}
      data-testid="upgrade-entitlement-hint"
    >
      <Crown size={14} />
      <span>{t(resolvedKey)}</span>
      {onUpgrade ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            trackUpgradeClick(resolvedSource)
            onUpgrade()
          }}
        >
          {t('entitlements.card.upgrade')}
        </button>
      ) : null}
    </div>
  )
}
