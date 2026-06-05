import { useEffect, useState } from 'react'
import { Gauge, RotateCcw } from 'lucide-react'
import { useI18n } from '../i18n'
import { formatTabCompletionMetricsLine } from '../lib/formatTabCompletionMetrics'
import { getTabCompletionMetrics, resetTabCompletionMetrics } from '../lib/inlineCompletionMetrics'

export function SettingsTabCompletionCard() {
  const { t } = useI18n()
  const [metrics, setMetrics] = useState(getTabCompletionMetrics)

  useEffect(() => {
    const id = window.setInterval(() => setMetrics(getTabCompletionMetrics()), 2000)
    return () => window.clearInterval(id)
  }, [])

  const metricsLine = formatTabCompletionMetricsLine(
    (key, params) => t(key, params),
    metrics,
  )

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-tab-completion">
      <div className="settings-privacy-row" style={{ justifyContent: 'space-between' }}>
        <div className="settings-privacy-row">
          <Gauge size={16} color="var(--accent-color)" />
          <strong>{t('settings.tabCompletion.metricsCardTitle')}</strong>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: 11 }}
          onClick={() => {
            resetTabCompletionMetrics()
            setMetrics(getTabCompletionMetrics())
          }}
        >
          <RotateCcw size={12} /> {t('settings.tabCompletion.metricsReset')}
        </button>
      </div>
      <p
        className="settings-privacy-text"
        style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-line' }}
      >
        {metricsLine}
      </p>
    </div>
  )
}
