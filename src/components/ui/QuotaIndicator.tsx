import { formatQuotaLabel, isUnlimitedQuota, quotaBarColor, quotaBarPercent } from '../../lib/quotaDisplay'
import { useI18n } from '../../i18n'
import type { QuotaCheck } from '../../services/aiService'

export interface QuotaIndicatorProps {
  quota: Pick<QuotaCheck, 'used' | 'limit' | 'remaining' | 'plan' | 'allowed'>
  label?: string
  compact?: boolean
  /** Minimal pill for chat control strip (label + value + thin bar only). */
  inline?: boolean
  /** Human-readable plan name for inline badges (e.g. 团队版). */
  planDisplayName?: string
  showPlan?: boolean
  className?: string
}

export function QuotaIndicator({
  quota,
  label,
  compact = false,
  inline = false,
  planDisplayName,
  showPlan = false,
  className = '',
}: QuotaIndicatorProps) {
  const { t } = useI18n()
  const displayLabel = label ?? t('quota.today')
  const percent = quotaBarPercent(quota.used, quota.limit)
  const barColor = quotaBarColor(quota.used, quota.limit)
  const exhausted = !quota.allowed
  const unlimited = isUnlimitedQuota(quota.limit)
  const hideHint = compact || inline
  const resolvedPlanName = planDisplayName?.trim() || quota.plan || ''

  if (inline && unlimited && !exhausted) {
    return (
      <div
        className={`quota-indicator quota-indicator--inline quota-indicator--inline-unlimited ${className}`.trim()}
        role="status"
        aria-label={
          resolvedPlanName
            ? t('quota.chatUnlimitedAria', { plan: resolvedPlanName, used: quota.used })
            : t('quota.formatUnlimited', { used: quota.used })
        }
        title={t('quota.unlimitedPlan')}
      >
        {resolvedPlanName ? (
          <span className="quota-indicator__plan-pill">{resolvedPlanName}</span>
        ) : null}
        <span className="quota-indicator__unlimited-tag">{t('quota.unlimitedShort')}</span>
        {quota.used > 0 ? (
          <span className="quota-indicator__used-today">{t('quota.usedTodayShort', { used: quota.used })}</span>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`quota-indicator ${compact ? 'quota-indicator--compact' : ''} ${inline ? 'quota-indicator--inline' : ''} ${exhausted ? 'quota-indicator--exhausted' : ''} ${className}`.trim()}
      role="status"
      aria-label={`${displayLabel} ${formatQuotaLabel(quota.used, quota.limit, t)}`}
    >
      <div className="quota-indicator__head">
        <span className="quota-indicator__label">{displayLabel}</span>
        <span className="quota-indicator__value">{formatQuotaLabel(quota.used, quota.limit, t)}</span>
      </div>
      {!inline || !unlimited ? (
        <div className="quota-indicator__track" aria-hidden>
          <div className="quota-indicator__fill" style={{ width: `${percent}%`, background: barColor }} />
        </div>
      ) : null}
      {!hideHint && (
        <p className="quota-indicator__hint">
          {exhausted ? (
            <>{t('quota.exhausted')}</>
          ) : unlimited ? (
            <>{t('quota.unlimitedPlan')}</>
          ) : (
            <>
              {t('quota.remaining', { count: Math.max(0, quota.remaining) })}
              {quota.plan === 'free' ? (
                <>
                  {' '}
                  · {t('quota.freeEconomyHint')}
                </>
              ) : null}
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
