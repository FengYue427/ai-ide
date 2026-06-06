import { Activity } from 'lucide-react'
import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { isAideRuntimeUiEnabled } from '../lib/aideRuntimeUi'
import {
  isActivityLineProductionEnabled,
  isAideRuntimeProductionEnabled,
} from '../lib/v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { formatRuntimeStateDisplayLines } from '../services/runtime/runtimeStateDisplay'
import { useIDEStore } from '../store/ideStore'

export function SettingsAideRuntimeStubCard() {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)

  if (!isAideRuntimeUiEnabled()) return null

  const runtimeProduction = isAideRuntimeProductionEnabled()
  const activityProduction = isActivityLineProductionEnabled()

  const runtimeStatePreview = useMemo(() => buildRuntimeStatePreview(files), [files])
  const runtimeStateLines =
    runtimeStatePreview.parse.ok && runtimeStatePreview.parse.document
      ? formatRuntimeStateDisplayLines(runtimeStatePreview.parse.document, (key, params) =>
          t(key, params),
        )
      : []

  const description = runtimeProduction
    ? t('settings.aideRuntime.engineProductionCardDesc', { mode: getOrchestratorMode() })
    : activityProduction
      ? t('settings.aideRuntime.productionCardDesc')
      : t('settings.aideRuntime.stubCardDesc', { mode: getOrchestratorMode() })

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-aide-runtime-stub">
      <div className="settings-privacy-row">
        <Activity size={16} color="var(--accent-color)" />
        <strong>{t('settings.aideRuntime.stubCardTitle')}</strong>
        {runtimeProduction ? (
          <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
            F4
          </span>
        ) : null}
        {activityProduction ? (
          <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
            F5
          </span>
        ) : null}
      </div>
      <p className="settings-privacy-text" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
        {description}
      </p>
      {runtimeProduction && runtimeStatePreview.exists ? (
        <div
          className="settings-privacy-text"
          data-testid="settings-runtime-state-summary"
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 11,
            lineHeight: 1.6,
            color: runtimeStatePreview.parse.ok ? 'var(--text-secondary)' : 'var(--danger-color, #c44)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
            {t('runtime.state.cardTitle')}
          </div>
          {runtimeStatePreview.parse.ok ? (
            runtimeStateLines.map((line) => <div key={line}>{line}</div>)
          ) : (
            runtimeStatePreview.parse.errors.map((err) => <div key={err}>{err}</div>)
          )}
        </div>
      ) : null}
    </div>
  )
}
