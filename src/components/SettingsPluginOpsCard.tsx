import { useEffect, useState } from 'react'
import { Puzzle, RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n'
import type { PluginOpsHealth } from '../hooks/usePlatformAiHealth'
import {
  fetchPluginPublishReviews,
  loadLocalPluginPublishReviews,
  type PluginPublishReviewItem,
} from '../services/pluginPublishReviewService'

interface SettingsPluginOpsCardProps {
  plugins: PluginOpsHealth
  healthStatus: 'loading' | 'ready' | 'unreachable'
  showReviews: boolean
}

export function SettingsPluginOpsCard({
  plugins,
  healthStatus,
  showReviews,
}: SettingsPluginOpsCardProps) {
  const { t } = useI18n()
  const [reviews, setReviews] = useState<PluginPublishReviewItem[]>(() =>
    loadLocalPluginPublishReviews(),
  )
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!showReviews) return
    let cancelled = false
    void fetchPluginPublishReviews().then((rows) => {
      if (!cancelled) setReviews(rows)
    })
    return () => {
      cancelled = true
    }
  }, [showReviews])

  const refreshReviews = () => {
    setRefreshing(true)
    void fetchPluginPublishReviews()
      .then(setReviews)
      .finally(() => setRefreshing(false))
  }

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-plugin-ops">
      <div className="settings-privacy-row">
        <Puzzle size={16} color="var(--accent-color)" />
        <strong>{t('settings.pluginOps.title')}</strong>
      </div>
      <p className="settings-privacy-text">{t('settings.pluginOps.desc')}</p>
      <ul className="settings-v12-status-list" style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}>
        <li>
          {t('settings.pluginOps.publishApi')}:{' '}
          {healthStatus === 'loading'
            ? '…'
            : plugins.publishEnabled
              ? t('settings.v12.statusOn')
              : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.pluginOps.officialKey')}:{' '}
          {healthStatus === 'loading'
            ? '…'
            : plugins.officialKeyConfigured
              ? t('settings.v12.statusOn')
              : t('settings.v12.statusOff')}
        </li>
      </ul>
      <p className="settings-privacy-text" style={{ marginTop: 10 }}>
        <a
          href="https://github.com/FengYue427/ai-ide/blob/main/docs/VERCEL_V1.2_PRODUCTION_ENV.md"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent-color)' }}
        >
          {t('settings.pluginOps.envDocLink')}
        </a>
        {' · '}
        <a
          href="https://github.com/FengYue427/ai-ide/blob/main/docs/V1.2.6_F3_PROD_FLAGS.md"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent-color)' }}
        >
          {t('settings.pluginOps.clientFlagsLink')}
        </a>
      </p>

      {showReviews ? (
        <div className="settings-plugin-ops-reviews" style={{ marginTop: 12 }}>
          <div className="settings-privacy-row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 12 }}>{t('settings.pluginOps.reviewsTitle')}</strong>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={refreshReviews}
              disabled={refreshing}
              aria-label={t('settings.pluginOps.reviewsRefresh')}
            >
              <RefreshCw size={12} className={refreshing ? 'platform-usage-dashboard__spin' : ''} />
            </button>
          </div>
          {reviews.length === 0 ? (
            <p className="settings-privacy-text" style={{ marginTop: 6 }}>
              {t('settings.pluginOps.reviewsEmpty')}
            </p>
          ) : (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
              {reviews.map((row) => (
                <li key={row.reviewId}>
                  <code>{row.reviewId}</code> · {row.pluginId}@{row.version} · {row.status}
                </li>
              ))}
            </ul>
          )}
          <p className="settings-privacy-text" style={{ marginTop: 6, fontSize: 11 }}>
            {t('settings.pluginOps.reviewsHint')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
