import { Activity } from 'lucide-react'
import { useI18n } from '../i18n'
import { isAideRuntimeUiEnabled } from '../lib/aideRuntimeUi'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'

export function SettingsAideRuntimeStubCard() {
  const { t } = useI18n()

  if (!isAideRuntimeUiEnabled()) return null

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-aide-runtime-stub">
      <div className="settings-privacy-row">
        <Activity size={16} color="var(--accent-color)" />
        <strong>{t('settings.aideRuntime.stubCardTitle')}</strong>
      </div>
      <p className="settings-privacy-text" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
        {t('settings.aideRuntime.stubCardDesc', { mode: getOrchestratorMode() })}
      </p>
    </div>
  )
}
