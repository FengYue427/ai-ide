import { memo } from 'react'
import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { formatAutopilotQuotaLabel } from '../lib/formatAutopilotQuota'
import type { AutopilotQuota } from '../services/autopilotUsageService'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'

interface AutopilotQuotaBarProps {
  quota: AutopilotQuota | null
  quotaBlocked?: boolean
  onUpgrade?: () => void
  compact?: boolean
}

export const AutopilotQuotaBar = memo(function AutopilotQuotaBar({
  quota,
  quotaBlocked = false,
  onUpgrade,
  compact = false,
}: AutopilotQuotaBarProps) {
  const { t } = useI18n()

  if (!quota) return null

  const showUpgrade = Boolean(onUpgrade) && (quotaBlocked || (!quota.unlimited && quota.limit > 0))

  if (quotaBlocked && onUpgrade) {
    return (
      <div
        className={`autopilot-quota-bar autopilot-quota-bar--blocked${
          compact ? ' autopilot-quota-bar--compact' : ''
        }`}
        data-testid="autopilot-quota-bar"
      >
        <UpgradeEntitlementHint compact feature="autopilotUnlimited" onUpgrade={onUpgrade} />
      </div>
    )
  }

  return (
    <div
      className={`autopilot-quota-bar${compact ? ' autopilot-quota-bar--compact' : ''}${
        quota.unlimited ? ' autopilot-quota-bar--unlimited' : ''
      }`}
      data-testid="autopilot-quota-bar"
    >
      <Sparkles size={14} aria-hidden />
      <span>{formatAutopilotQuotaLabel(quota, t)}</span>
      {showUpgrade ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onUpgrade}>
          {t('backgroundJobs.upgradePro')}
        </button>
      ) : null}
    </div>
  )
})
