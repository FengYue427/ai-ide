import { Rocket } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  getV15FeatureStatus,
  TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS,
  TAB_PLUS_PLUS_PRODUCTION_MAX_LINES,
  TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS,
} from '../lib/v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { SettingsFeatureCardShell } from './settings/SettingsFeatureCardShell'

export function SettingsV15FeaturesCard() {
  const { t } = useI18n()
  const status = getV15FeatureStatus()

  return (
    <SettingsFeatureCardShell
      testId="settings-v15-features"
      icon={<Rocket size={16} color="var(--accent-color)" />}
      title={t('settings.v15.title')}
      badge={
        <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
          v1.5
        </span>
      }
      description={t('settings.v15.desc')}
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
    </SettingsFeatureCardShell>
  )
}
