import { useEffect, useState } from 'react'
import { Gauge, RotateCcw } from 'lucide-react'
import { useI18n } from '../i18n'
import { formatTabCompletionMetricsLine } from '../lib/formatTabCompletionMetrics'
import { getTabCompletionMetrics, resetTabCompletionMetrics } from '../lib/inlineCompletionMetrics'
import {
  isTabPlusPlusPocEnabled,
  TAB_PLUS_PLUS_POC_DEBOUNCE_MS,
  TAB_PLUS_PLUS_POC_P95_TARGET_MS,
} from '../lib/tabPlusPlusPoc'
import { getTabCompletionDebounceMs } from '../lib/inlineCompletionPrefs'
import {
  isTabPlusPlusProductionEnabled,
  TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS,
  TAB_PLUS_PLUS_PRODUCTION_MAX_LINES,
  TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS,
} from '../lib/v15Features'

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
      {isTabPlusPlusPocEnabled() ? (
        <>
          <p
            className="settings-privacy-text"
            data-testid="settings-tab-plus-plus-poc"
            style={{ marginTop: 6, fontSize: 12, color: 'var(--accent-color)' }}
          >
            {t('settings.tabCompletion.tabPlusPlusPocOn')}
          </p>
          <p className="settings-privacy-text" style={{ marginTop: 4, fontSize: 11 }}>
            {t('settings.tabCompletion.tabPlusPlusPocTargets', {
              p95: String(TAB_PLUS_PLUS_POC_P95_TARGET_MS),
              debounce: String(getTabCompletionDebounceMs() || TAB_PLUS_PLUS_POC_DEBOUNCE_MS),
            })}
          </p>
        </>
      ) : null}
      {isTabPlusPlusProductionEnabled() ? (
        <>
          <p
            className="settings-privacy-text"
            data-testid="settings-tab-plus-plus-production"
            style={{ marginTop: 6, fontSize: 12, color: 'var(--accent-color)' }}
          >
            {t('settings.tabCompletion.tabPlusPlusProductionOn')}
          </p>
          <p className="settings-privacy-text" style={{ marginTop: 4, fontSize: 11 }}>
            {t('settings.tabCompletion.tabPlusPlusProductionTargets', {
              p95: String(TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS),
              debounce: String(getTabCompletionDebounceMs() || TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS),
              lines: String(TAB_PLUS_PLUS_PRODUCTION_MAX_LINES),
            })}
          </p>
        </>
      ) : null}
    </div>
  )
}
