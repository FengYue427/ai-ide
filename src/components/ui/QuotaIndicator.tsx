import { formatQuotaLabel, isUnlimitedQuota, quotaBarColor, quotaBarPercent } from '../../lib/quotaDisplay'
import { useI18n } from '../../i18n'
import type { QuotaCheck } from '../../services/aiService'

export interface QuotaIndicatorProps {
  quota: Pick<QuotaCheck, 'used' | 'limit' | 'remaining' | 'plan' | 'allowed'>
  label?: string
  compact?: boolean
  showPlan?: boolean
  className?: string
}

export function QuotaIndicator({
  quota,
  label,
  compact = false,
  showPlan = false,
  className = '',
}: QuotaIndicatorProps) {
  const { t } = useI18n()
  const displayLabel = label ?? t('quota.today')
  const percent = quotaBarPercent(quota.used, quota.limit)
  const barColor = quotaBarColor(quota.used, quota.limit)
  const exhausted = !quota.allowed

  return (
    <div
      className={`quota-indicator ${compact ? 'quota-indicator--compact' : ''} ${exhausted ? 'quota-indicator--exhausted' : ''} ${className}`.trim()}
      role="status"
      aria-label={`${displayLabel} ${formatQuotaLabel(quota.used, quota.limit, t)}`}
    >
      <div className="quota-indicator__head">
        <span className="quota-indicator__label">{displayLabel}</span>
        <span className="quota-indicator__value">{formatQuotaLabel(quota.used, quota.limit, t)}</span>
      </div>
      <div className="quota-indicator__track" aria-hidden>
        <div className="quota-indicator__fill" style={{ width: `${percent}%`, background: barColor }} />
      </div>
      {!compact && (
        <p className="quota-indicator__hint">
          {exhausted ? (
            <>{t('quota.exhausted')}</>
          ) : isUnlimitedQuota(quota.limit) ? (
            <>{t('quota.unlimitedPlan')}</>
          ) : (
            <>
              {t('quota.remaining', { count: Math.max(0, quota.remaining) })}
              {showPlan && quota.plan ? (
                <>
                  {' '}
                  · {t('quota.plan')} <strong>{quota.plan}</strong>
                </>
              ) : null}
            </>
          )}
        </p>
      )}
    </div>
  )
}
