import { memo } from 'react'
import { Play, X } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  dismissSessionResumeBar,
  isSessionResumeStale,
  type SessionResumeSnapshot,
} from '../lib/sessionResume'
import { getSessionResumeMaxAgeMs } from '../lib/clientPlanEntitlements'
import { useIDEStore } from '../store/ideStore'

interface SessionResumeBarProps {
  snapshot: SessionResumeSnapshot
  onContinue: () => void
  onDismiss: () => void
}

export const SessionResumeBar = memo(function SessionResumeBar({
  snapshot,
  onContinue,
  onDismiss,
}: SessionResumeBarProps) {
  const { t } = useI18n()
  const currentPlan = useIDEStore((s) => s.currentPlan)
  if (isSessionResumeStale(snapshot, getSessionResumeMaxAgeMs(currentPlan ?? 'free'))) return null

  const detailParts = [
    snapshot.activeSpecSlug ? t('sessionResume.spec', { slug: snapshot.activeSpecSlug }) : null,
    snapshot.openTaskCount > 0 ? t('sessionResume.openTasks', { count: snapshot.openTaskCount }) : null,
    snapshot.activeFileName ? t('sessionResume.file', { name: snapshot.activeFileName.split('/').pop() ?? snapshot.activeFileName }) : null,
  ].filter(Boolean)

  return (
    <div className="session-resume-bar" data-testid="session-resume-bar">
      <div className="session-resume-bar__main">
        <span className="session-resume-bar__title">{t('sessionResume.title')}</span>
        <span className="session-resume-bar__detail">{detailParts.join(' · ') || t('sessionResume.generic')}</span>
      </div>
      <button type="button" className="btn btn-primary session-resume-bar__continue" onClick={onContinue}>
        <Play size={14} />
        {t('sessionResume.continue')}
      </button>
      <button
        type="button"
        className="panel-close-btn session-resume-bar__dismiss"
        aria-label={t('common.close')}
        onClick={() => {
          dismissSessionResumeBar()
          onDismiss()
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
})
