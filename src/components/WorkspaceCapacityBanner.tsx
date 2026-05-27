import { AlertTriangle, HardDrive } from 'lucide-react'
import { useI18n } from '../i18n'
import type { WorkspaceLimitSnapshot } from '../services/workspaceLimits'

type WorkspaceCapacityBannerProps = {
  snapshot: WorkspaceLimitSnapshot
  compact?: boolean
  onOpenDocs?: () => void
}

export function WorkspaceCapacityBanner({ snapshot, compact, onOpenDocs }: WorkspaceCapacityBannerProps) {
  const { t } = useI18n()
  const { current, max, tier, isDesktop, percent } = snapshot

  const barColor =
    tier === 'full'
      ? 'var(--danger-color)'
      : tier === 'warn'
        ? 'var(--warning-color)'
        : 'var(--accent-color)'

  return (
    <div
      className={`workspace-capacity ${compact ? 'workspace-capacity--compact' : ''} ${tier !== 'ok' ? 'workspace-capacity--alert' : ''}`}
      role="status"
    >
      <div className="workspace-capacity__row">
        <HardDrive size={14} />
        <span className="workspace-capacity__label">
          {t('limits.files', { current, max })}
        </span>
        {tier !== 'ok' ? <AlertTriangle size={14} className="workspace-capacity__warn-icon" /> : null}
      </div>
      <div className="workspace-capacity__track" aria-hidden>
        <div className="workspace-capacity__fill" style={{ width: `${percent}%`, background: barColor }} />
      </div>
      {tier === 'full' ? (
        <p className="workspace-capacity__hint">
          {isDesktop
            ? t('limits.fullDesktop')
            : t('limits.fullBrowser')}
          {onOpenDocs ? (
            <>
              {' '}
              <button type="button" className="workspace-capacity__link" onClick={onOpenDocs}>
                {t('limits.learnMore')}
              </button>
            </>
          ) : null}
        </p>
      ) : tier === 'warn' ? (
        <p className="workspace-capacity__hint">{t('limits.warn')}</p>
      ) : !compact ? (
        <p className="workspace-capacity__hint workspace-capacity__hint--muted">
          {isDesktop ? t('limits.hintDesktop') : t('limits.hintBrowser')}
        </p>
      ) : null}
    </div>
  )
}
