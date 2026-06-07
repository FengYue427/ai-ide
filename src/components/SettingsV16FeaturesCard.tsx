import { Rocket } from 'lucide-react'
import { useI18n } from '../i18n'
import { isTabPlusPlusProductionEnabled, isByokLegacyAllowed } from '../lib/v15Features'
import { getV16FeatureStatus, isV16ProductionBuild } from '../lib/v16Features'

export function SettingsV16FeaturesCard() {
  const { t } = useI18n()
  const status = getV16FeatureStatus()
  const platformGateway = import.meta.env.VITE_AI_GATEWAY === 'true' || import.meta.env.VITE_AI_GATEWAY === '1'

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-v16-features">
      <div className="settings-privacy-row">
        <Rocket size={16} color="var(--accent-color)" />
        <strong>{t('settings.v16.title')}</strong>
        <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
          v1.6
        </span>
      </div>
      <p className="settings-privacy-text">{t('settings.v16.desc')}</p>
      <ul
        className="settings-v12-status-list"
        style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}
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
          {t('settings.v16.overseasBilling')}:{' '}
          {t('settings.v16.overseasDeferred')}
        </li>
        <li>
          GA build: {isV16ProductionBuild() ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          BYOK legacy: {isByokLegacyAllowed() ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
      </ul>
    </div>
  )
}
