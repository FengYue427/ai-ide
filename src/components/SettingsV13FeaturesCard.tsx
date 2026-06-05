import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { getV13FeatureStatus } from '../lib/v13Features'

export function SettingsV13FeaturesCard() {
  const { t } = useI18n()
  const status = getV13FeatureStatus()

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-v13-features">
      <div className="settings-privacy-row">
        <Sparkles size={16} color="var(--accent-color)" />
        <strong>{t('settings.v13.title')}</strong>
      </div>
      <p className="settings-privacy-text">{t('settings.v13.desc')}</p>
      <ul className="settings-v12-status-list" style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}>
        <li>
          {t('settings.v13.pythonNav')}:{' '}
          {status.pythonNavigation ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v13.embeddingPersist')}:{' '}
          {status.embeddingPersistCache ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v13.indexTelemetry')}:{' '}
          {status.indexBuildTelemetry ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v13.backgroundAgent')}:{' '}
          {status.backgroundAgent ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
      </ul>
    </div>
  )
}
