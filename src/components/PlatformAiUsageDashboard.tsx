import { BarChart3, RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n'
import { isByokLegacyAllowed } from '../lib/v15Features'
import type { PlatformUsageDashboard } from '../services/platformUsageDashboardService'
import { QuotaIndicator } from './ui/QuotaIndicator'

interface PlatformAiUsageDashboardProps {
  data: PlatformUsageDashboard
  onRefresh?: () => void
  refreshing?: boolean
}

function maxBarValue(daily: PlatformUsageDashboard['daily']): number {
  let max = 1
  for (const row of daily) {
    max = Math.max(max, row.platform, row.other, row.total)
  }
  return max
}

function formatUsd(value: number): string {
  if (value === 0) return '$0'
  if (value < 0.01) return `<$0.01`
  return `$${value.toFixed(value < 1 ? 3 : 2)}`
}

export function PlatformAiUsageDashboard({
  data,
  onRefresh,
  refreshing = false,
}: PlatformAiUsageDashboardProps) {
  const { t } = useI18n()
  const platformOnly = !isByokLegacyAllowed()
  const barMax = maxBarValue(data.daily)

  return (
    <div className="settings-card platform-usage-dashboard" data-testid="platform-usage-dashboard">
      <div className="platform-usage-dashboard__head">
        <div className="settings-privacy-row">
          <BarChart3 size={16} color="var(--accent-color)" />
          <strong>{t('settings.ai.usageDashboardTitle')}</strong>
        </div>
        {onRefresh ? (
          <button
            type="button"
            className="btn btn-secondary platform-usage-dashboard__refresh"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={t('settings.ai.usageDashboardRefresh')}
          >
            <RefreshCw size={14} className={refreshing ? 'platform-usage-dashboard__spin' : ''} />
          </button>
        ) : null}
      </div>

      <p className="settings-privacy-text">
        {t(platformOnly ? 'settings.ai.usageDashboardDescPlatform' : 'settings.ai.usageDashboardDesc')}
      </p>

      <QuotaIndicator quota={data.quota} showPlan compact={false} className="platform-usage-dashboard__quota" />

      {data.quotaNearLimit && !data.quota.allowed ? null : data.quotaNearLimit ? (
        <div
          className="platform-usage-dashboard__quota-warn"
          role="status"
          data-testid="platform-usage-quota-warn"
        >
          {t('settings.ai.usageQuotaNearLimit', {
            percent: data.quotaUsagePercent,
            used: data.quota.used,
            limit: data.quota.limit,
          })}
        </div>
      ) : null}

      <div className="platform-usage-dashboard__stats">
        {data.platformProvider ? (
          <div className="platform-usage-dashboard__stat">
            <span className="platform-usage-dashboard__stat-label">
              {t('settings.ai.usagePlatformProvider')}
            </span>
            <span className="platform-usage-dashboard__stat-value">{data.platformProvider}</span>
          </div>
        ) : null}
        <div className="platform-usage-dashboard__stat">
          <span className="platform-usage-dashboard__stat-label">
            {t('settings.ai.usagePlatformToday')}
          </span>
          <span className="platform-usage-dashboard__stat-value">{data.platformToday}</span>
        </div>
        <div className="platform-usage-dashboard__stat">
          <span className="platform-usage-dashboard__stat-label">
            {t(platformOnly ? 'settings.ai.usageOtherTodayPlatform' : 'settings.ai.usageOtherToday')}
          </span>
          <span className="platform-usage-dashboard__stat-value">{data.otherToday}</span>
        </div>
        <div className="platform-usage-dashboard__stat">
          <span className="platform-usage-dashboard__stat-label">
            {t('settings.ai.usageCostToday')}
          </span>
          <span className="platform-usage-dashboard__stat-value">
            {formatUsd(data.costEstimateTodayUsd)}
          </span>
        </div>
        <div className="platform-usage-dashboard__stat">
          <span className="platform-usage-dashboard__stat-label">
            {t('settings.ai.usageCostPeriod', { days: String(data.periodDays) })}
          </span>
          <span className="platform-usage-dashboard__stat-value">
            {formatUsd(data.costEstimatePeriodUsd)}
          </span>
        </div>
      </div>

      <p className="platform-usage-dashboard__footnote">
        {t('settings.ai.usageCostFootnote', {
          rate: String(data.costPerRequestUsd),
          days: String(data.periodDays),
          total: String(data.platformPeriodTotal),
        })}
      </p>

      <div className="platform-usage-dashboard__chart" role="img" aria-label={t('settings.ai.usageChartAria')}>
        <div className="platform-usage-dashboard__chart-legend">
          <span>
            <i className="platform-usage-dashboard__dot platform-usage-dashboard__dot--platform" />
            {t('settings.ai.usageLegendPlatform')}
          </span>
          <span>
            <i className="platform-usage-dashboard__dot platform-usage-dashboard__dot--other" />
            {t('settings.ai.usageLegendOther')}
          </span>
        </div>
        <div className="platform-usage-dashboard__bars">
          {data.daily.map((row) => {
            const platformPct = Math.round((row.platform / barMax) * 100)
            const otherPct = Math.round((row.other / barMax) * 100)
            const label = row.date.slice(5)
            return (
              <div key={row.date} className="platform-usage-dashboard__bar-col" title={row.date}>
                <div className="platform-usage-dashboard__bar-stack">
                  <div
                    className="platform-usage-dashboard__bar platform-usage-dashboard__bar--other"
                    style={{ height: `${otherPct}%` }}
                  />
                  <div
                    className="platform-usage-dashboard__bar platform-usage-dashboard__bar--platform"
                    style={{ height: `${platformPct}%` }}
                  />
                </div>
                <span className="platform-usage-dashboard__bar-label">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
