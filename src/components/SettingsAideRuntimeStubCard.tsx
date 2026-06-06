import { Activity } from 'lucide-react'
import { useI18n } from '../i18n'
import { isAideRuntimeUiEnabled } from '../lib/aideRuntimeUi'
import {
  isActivityLineProductionEnabled,
  isAideRuntimeProductionEnabled,
} from '../lib/v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'

export function SettingsAideRuntimeStubCard() {
  const { t } = useI18n()

  if (!isAideRuntimeUiEnabled()) return null

  const runtimeProduction = isAideRuntimeProductionEnabled()
  const activityProduction = isActivityLineProductionEnabled()

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
    </div>
  )
}
