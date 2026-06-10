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

/** Runtime + Activity Line status (production or legacy preview). */
export function SettingsAideRuntimeStubCard() {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)

  const runtimeProduction = isAideRuntimeProductionEnabled()
  const activityProduction = isActivityLineProductionEnabled()
  const legacyStubOnly = isAideRuntimeUiEnabled() && !runtimeProduction && !activityProduction

  if (!isAideRuntimeUiEnabled()) return null

  const runtimeStatePreview = useMemo(() => buildRuntimeStatePreview(files), [files])
  const runtimeStateLines =
    runtimeStatePreview.parse.ok && runtimeStatePreview.parse.document
      ? formatRuntimeStateDisplayLines(runtimeStatePreview.parse.document, (key, params) =>
          t(key, params),
        )
      : []

  const title = runtimeProduction
    ? t('settings.aideRuntime.engineProductionCardTitle')
    : activityProduction
      ? t('settings.aideRuntime.productionCardTitle')
      : t('settings.aideRuntime.stubCardTitle')

  const description = runtimeProduction
    ? t('settings.aideRuntime.engineProductionCardDesc', { mode: getOrchestratorMode() })
    : activityProduction
      ? t('settings.aideRuntime.productionCardDesc')
      : t('settings.aideRuntime.stubCardDesc', { mode: getOrchestratorMode() })

  return (
    <div
      className="settings-card settings-card--grid"
      data-testid={legacyStubOnly ? 'settings-aide-runtime-stub' : 'settings-aide-runtime-card'}
    >
      <div className="settings-privacy-row">
        <Activity size={16} color="var(--accent-color)" />
        <strong>{title}</strong>
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
      <p className="settings-privacy-text settings-runtime-card-desc">{description}</p>
      {runtimeProduction && runtimeStatePreview.exists ? (
        <div
          className="settings-privacy-text settings-runtime-state-summary"
          data-testid="settings-runtime-state-summary"
        >
          <div className="settings-runtime-state-summary__title">{t('runtime.state.cardTitle')}</div>
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
