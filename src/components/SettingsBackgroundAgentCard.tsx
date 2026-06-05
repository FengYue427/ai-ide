import { Cloud } from 'lucide-react'
import { useI18n } from '../i18n'
import { getBackgroundAgentFeatureStatus } from '../lib/backgroundAgentFeatures'

export function SettingsBackgroundAgentCard() {
  const { t } = useI18n()
  const status = getBackgroundAgentFeatureStatus()

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-background-agent">
      <div className="settings-privacy-row">
        <Cloud size={16} color="var(--accent-color)" />
        <strong>{t('settings.backgroundAgent.title')}</strong>
      </div>
      <p className="settings-privacy-text">{t('settings.backgroundAgent.desc')}</p>
      <ul className="settings-v12-status-list" style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}>
        <li>
          {t('settings.backgroundAgent.enabled')}:{' '}
          {status.enabled ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.backgroundAgent.cron')}: <code>{status.cronHint}</code>
        </li>
      </ul>
      <p className="settings-privacy-text" style={{ marginTop: 8, fontSize: 11 }}>
        {t('settings.backgroundAgent.envHint')}
      </p>
    </div>
  )
}
