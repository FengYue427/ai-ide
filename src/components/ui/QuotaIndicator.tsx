import { formatQuotaLabel, isUnlimitedQuota, quotaBarColor, quotaBarPercent } from '../../lib/quotaDisplay'
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
  label = '今日 AI 用量',
  compact = false,
  showPlan = false,
  className = '',
}: QuotaIndicatorProps) {
  const percent = quotaBarPercent(quota.used, quota.limit)
  const barColor = quotaBarColor(quota.used, quota.limit)
  const exhausted = !quota.allowed

  return (
    <div
      className={`quota-indicator ${compact ? 'quota-indicator--compact' : ''} ${exhausted ? 'quota-indicator--exhausted' : ''} ${className}`.trim()}
      role="status"
      aria-label={`${label} ${formatQuotaLabel(quota.used, quota.limit)}`}
    >
      <div className="quota-indicator__head">
        <span className="quota-indicator__label">{label}</span>
        <span className="quota-indicator__value">{formatQuotaLabel(quota.used, quota.limit)}</span>
      </div>
      <div className="quota-indicator__track" aria-hidden>
        <div
          className="quota-indicator__fill"
          style={{ width: `${percent}%`, background: barColor }}
        />
      </div>
      {!compact && (
        <p className="quota-indicator__hint">
          {exhausted ? (
            <>今日额度已用完，请明天再试或升级套餐。</>
          ) : isUnlimitedQuota(quota.limit) ? (
            <>当前计划配额不限。</>
          ) : (
            <>
              剩余约 <strong>{Math.max(0, quota.remaining)}</strong> 次
              {showPlan && quota.plan ? (
                <>
                  {' '}
                  · 计划 <strong>{quota.plan}</strong>
                </>
              ) : null}
            </>
          )}
        </p>
      )}
    </div>
  )
}
