import { Rocket } from 'lucide-react'
import { useI18n } from '../i18n'
import { isTabPlusPlusProductionEnabled, isByokLegacyAllowed } from '../lib/v15Features'
import { getV16FeatureStatus, isV16ProductionBuild } from '../lib/v16Features'
import { SettingsFeatureCardShell } from './settings/SettingsFeatureCardShell'

export function SettingsV16FeaturesCard() {
  const { t } = useI18n()
  const status = getV16FeatureStatus()
  const platformGateway = import.meta.env.VITE_AI_GATEWAY === 'true' || import.meta.env.VITE_AI_GATEWAY === '1'

  return (
    <SettingsFeatureCardShell
      testId="settings-v16-features"
      icon={<Rocket size={16} color="var(--accent-color)" />}
      title={t('settings.v16.title')}
      badge={
        <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
          v1.6
        </span>
      }
      description={t('settings.v16.desc')}
    >
      <li>
        {t('settings.v16.platformAi')}:{' '}
        {platformGateway && !status.byokLegacy ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
      </li>
      <li>
        {t('settings.v16.tabPlusPlus')}:{' '}
        {isTabPlusPlusProductionEnabled() ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
      </li>
      <li>
        {t('settings.v16.overseasBilling')}: {t('settings.v16.overseasDeferred')}
      </li>
      <li>
        {t('settings.v16.gaBuild')}:{' '}
        {isV16ProductionBuild() ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
      </li>
      <li>
        {t('settings.v16.byokLegacy')}:{' '}
        {isByokLegacyAllowed() ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
      </li>
    </SettingsFeatureCardShell>
  )
}
