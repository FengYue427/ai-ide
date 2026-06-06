import { Rocket } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  getV15FeatureStatus,
  TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS,
  TAB_PLUS_PLUS_PRODUCTION_MAX_LINES,
  TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS,
} from '../lib/v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'

export function SettingsV15FeaturesCard() {
  const { t } = useI18n()
  const status = getV15FeatureStatus()

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-v15-features">
      <div className="settings-privacy-row">
        <Rocket size={16} color="var(--accent-color)" />
        <strong>{t('settings.v15.title')}</strong>
        <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
          v1.5
        </span>
      </div>
      <p className="settings-privacy-text">{t('settings.v15.desc')}</p>
      <ul
        className="settings-v12-status-list"
        style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}
      >
        <li>
          {t('settings.v15.platformModels')}:{' '}
          {!status.byokLegacy ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v15.tabPlusPlus')}:{' '}
          {status.tabPlusPlusProduction ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        {status.tabPlusPlusProduction ? (
          <li>
            {t('settings.v15.tabPlusPlusTargets', {
              p95: String(TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS),
              debounce: String(TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS),
              lines: String(TAB_PLUS_PLUS_PRODUCTION_MAX_LINES),
            })}
          </li>
        ) : null}
        <li>
          {t('settings.v15.specArtifactsV2')}:{' '}
          {status.specArtifactsV2 ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v15.aideRuntime')}:{' '}
          {status.aideRuntime ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        {status.aideRuntime ? (
          <li>{t('settings.v15.orchestratorMode', { mode: getOrchestratorMode() })}</li>
        ) : null}
        <li>
          {t('settings.v15.activityLine')}:{' '}
          {status.activityLine ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v15.byokLegacy')}:{' '}
          {status.byokLegacy ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
      </ul>
    </div>
  )
}
