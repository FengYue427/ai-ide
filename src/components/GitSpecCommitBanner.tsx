import { memo, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '../i18n'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { useIDEStore } from '../store/ideStore'

interface GitSpecCommitBannerProps {
  onOpenTasks?: () => void
  onSwitchReviewMode?: () => void
}

export const GitSpecCommitBanner = memo(function GitSpecCommitBanner({
  onOpenTasks,
  onSwitchReviewMode,
}: GitSpecCommitBannerProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const summary = buildSpecStatusSummary(files)

  useEffect(() => {
    if (summary.openTaskCount <= 0) return
    emitAideLinkEvent('git-commit-blocked', {
      slug: summary.activeSpecSlug,
      count: summary.openTaskCount,
    })
  }, [summary.activeSpecSlug, summary.openTaskCount])

  if (summary.openTaskCount <= 0) return null

  return (
    <div className="git-spec-commit-banner" data-testid="git-spec-commit-banner">
      <AlertTriangle size={14} />
      <span>
        {t('gitSpecCommit.hint', { count: summary.openTaskCount, slug: summary.activeSpecSlug ?? 'spec' })}
      </span>
      {onOpenTasks ? (
        <button type="button" className="btn btn-secondary git-spec-commit-banner__action" onClick={onOpenTasks}>
          {t('gitSpecCommit.openTasks')}
        </button>
      ) : null}
      {onSwitchReviewMode ? (
        <button type="button" className="btn btn-secondary git-spec-commit-banner__action" onClick={onSwitchReviewMode}>
          {t('gitSpecCommit.reviewMode')}
        </button>
      ) : null}
    </div>
  )
})
