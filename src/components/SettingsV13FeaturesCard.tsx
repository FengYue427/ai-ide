import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { getIndexBuildTelemetry } from '../lib/indexBuildTelemetry'
import {
  getV13FeatureStatus,
  isEmbeddingPersistCacheEnabled,
  isIndexBuildTelemetryEnabled,
} from '../lib/v13Features'
import { getEmbeddingPersistMetrics } from '../services/embeddingPersistCache'

export function SettingsV13FeaturesCard() {
  const { t } = useI18n()
  const status = getV13FeatureStatus()
  const [embeddingMetrics, setEmbeddingMetrics] = useState(getEmbeddingPersistMetrics)
  const [indexTelemetry, setIndexTelemetry] = useState(getIndexBuildTelemetry)

  useEffect(() => {
    const id = window.setInterval(() => {
      setEmbeddingMetrics(getEmbeddingPersistMetrics())
      setIndexTelemetry(getIndexBuildTelemetry())
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

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
        {isEmbeddingPersistCacheEnabled() ? (
          <li>
            {t('settings.v13.embeddingMetrics', {
              hits: embeddingMetrics.hits,
              misses: embeddingMetrics.misses,
              expired: embeddingMetrics.expired,
            })}
          </li>
        ) : null}
        {isIndexBuildTelemetryEnabled() && indexTelemetry.lastMode ? (
          <li>
            {t('settings.v13.indexBuildMode', {
              mode: indexTelemetry.lastMode,
              ms: indexTelemetry.lastDurationMs ?? '—',
            })}
          </li>
        ) : null}
      </ul>
    </div>
  )
}
