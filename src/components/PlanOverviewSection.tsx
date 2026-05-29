import { useI18n } from '../i18n'

interface PlanOverviewSectionProps {
  planCount: number
  openSteps: number
  planQueueCount: number
  specQueueCount: number
  isQueueRunning: boolean
  latestReportAt: string | null
  onSyncAideToWorkspace?: () => void
}

function formatTime(value: string | null, fallback: string): string {
  if (!value) return fallback
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Date(parsed).toLocaleString()
}

export function PlanOverviewSection({
  planCount,
  openSteps,
  planQueueCount,
  specQueueCount,
  isQueueRunning,
  latestReportAt,
  onSyncAideToWorkspace,
}: PlanOverviewSectionProps) {
  const { t } = useI18n()
  return (
    <div className="settings-card settings-card--grid">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="settings-row-title">{t('plan.overview.title')}</div>
          <div className="settings-row-desc">
            {t('plan.overview.desc', {
              planCount,
              openSteps,
              planQueueCount,
              specQueueCount,
              latestReportAt: formatTime(latestReportAt, t('plan.overview.noReport')),
            })}
          </div>
        </div>
        <span
          className={`settings-badge ${isQueueRunning ? 'settings-badge--experimental' : 'settings-badge--enabled'}`}
        >
          {isQueueRunning ? t('plan.overview.running') : t('plan.overview.idle')}
        </span>
      </div>
      {onSyncAideToWorkspace ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={onSyncAideToWorkspace}>
            {t('plan.overview.syncAide')}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('plan.overview.syncAideHint')}</span>
        </div>
      ) : null}
    </div>
  )
}
