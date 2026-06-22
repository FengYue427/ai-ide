import { memo, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { resolveAppLogo } from '../lib/appOrigin'
import { buildShareProgressViewModel } from '../lib/shareProgressView'
import { buildShareProgressDigest } from '../lib/shareProgressDigest'
import {
  addShareProgressComment,
  listShareProgressComments,
} from '../lib/shareProgressComments'
import {
  hasShareProgressUpdate,
  isShareProgressWatched,
  markShareProgressSeen,
  subscribeShareProgressWatch,
  unsubscribeShareProgressWatch,
} from '../lib/shareProgressWatch'
import { generateShareUrl, loadShareById } from '../services/shareService'
import { authService } from '../services/authService'
import { canUseEntitlement } from '../lib/planFeatureGate'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { ShareIntentGraph } from './intent/ShareIntentGraph'
import { useIDEStore } from '../store/ideStore'

interface ShareProgressPageProps {
  shareId: string
}

export const ShareProgressPage = memo(function ShareProgressPage({ shareId }: ShareProgressPageProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [files, setFiles] = useState<{ name: string; content: string; language: string }[]>([])
  const [proofPreviewPath, setProofPreviewPath] = useState<string | null>(null)
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentsTick, setCommentsTick] = useState(0)
  const [watched, setWatched] = useState(() => isShareProgressWatched(shareId))
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const canComment =
    Boolean(authService.getCurrentUser()) && canUseEntitlement('shareProgressComments')
  const canWatchProgress = canUseEntitlement('shareProgressWatch')
  const logoUrl = resolveAppLogo()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void loadShareById(shareId).then((data) => {
      if (cancelled) return
      if (!data?.files.length) {
        setMissing(true)
        setFiles([])
      } else {
        setMissing(false)
        setFiles(data.files)
        const nextView = buildShareProgressViewModel(data.files)
        markShareProgressSeen(shareId, buildShareProgressDigest(nextView))
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [shareId])

  const view = useMemo(() => (files.length > 0 ? buildShareProgressViewModel(files) : null), [files])
  const progressDigest = useMemo(() => (view ? buildShareProgressDigest(view) : ''), [view])
  const hasUpdate = watched && progressDigest ? hasShareProgressUpdate(shareId, progressDigest) : false
  const proofHtmlFiles = view?.proofHtmlFiles ?? []
  const proofPreview = useMemo(() => {
    if (!proofPreviewPath) return proofHtmlFiles[proofHtmlFiles.length - 1]
    return proofHtmlFiles.find((file) => file.name === proofPreviewPath) ?? proofHtmlFiles[proofHtmlFiles.length - 1]
  }, [proofHtmlFiles, proofPreviewPath])
  const comments = useMemo(
    () => listShareProgressComments(shareId),
    [commentsTick, shareId],
  )
  const graphNodes = view?.intentSnapshot?.graph.nodes ?? []
  const intentGraph = view?.intentSnapshot?.graph ?? null
  const fullIdeUrl = generateShareUrl(shareId)

  if (loading) {
    return (
      <div className="share-progress-page" data-testid="share-progress-page">
        <div className="share-progress-page__loading">
          <Loader2 size={24} className="spin" aria-hidden />
          <span>{t('shareProgress.loading')}</span>
        </div>
      </div>
    )
  }

  if (missing || !view) {
    return (
      <div className="share-progress-page" data-testid="share-progress-page">
        <header className="share-progress-page__header">
          {logoUrl ? <img src={logoUrl} alt="" className="share-progress-page__logo" /> : null}
          <h1>{t('share.progress.readonlyTitle')}</h1>
        </header>
        <p className="share-progress-page__empty">{t('shareProgress.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="share-progress-page" data-testid="share-progress-page">
      <header className="share-progress-page__header">
        {logoUrl ? <img src={logoUrl} alt="" className="share-progress-page__logo" /> : null}
        <div>
          <h1>{t('share.progress.readonlyTitle')}</h1>
          <p>{t('share.progress.readonlyDesc')}</p>
        </div>
        <div className="share-progress-page__header-actions">
          {canWatchProgress ? (
            <button
              type="button"
              className={`btn btn-secondary${hasUpdate ? ' share-progress-page__watch--updated' : ''}`}
              data-testid={hasUpdate ? 'share-progress-watch-updated' : 'share-progress-watch'}
              onClick={() => {
                if (watched) {
                  unsubscribeShareProgressWatch(shareId)
                  setWatched(false)
                } else if (view) {
                  subscribeShareProgressWatch(shareId, view.intentSummary || shareId, progressDigest)
                  setWatched(true)
                }
              }}
            >
              {watched
                ? hasUpdate
                  ? t('shareProgress.watchUpdated')
                  : t('shareProgress.unwatch')
                : t('shareProgress.watch')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              disabled
              data-testid="share-progress-watch-locked"
              title={t('entitlements.upgrade.shareProgressWatch')}
            >
              {t('shareProgress.watch')}
            </button>
          )}
          <a className="btn btn-secondary share-progress-page__open-ide" href={fullIdeUrl}>
            <ExternalLink size={14} />
            {t('shareProgress.openFullIde')}
          </a>
        </div>
      </header>

      {!canWatchProgress ? (
        <UpgradeEntitlementHint
          feature="shareProgressWatch"
          onUpgrade={() => setShowSubscriptionModal(true)}
        />
      ) : null}

      {hasUpdate ? (
        <div className="share-progress-page__update-banner" role="status" data-testid="share-progress-update-banner">
          {t('shareProgress.updateBanner')}
        </div>
      ) : null}

      <div className="share-progress-page__grid">
        <section className="share-progress-page__card">
          <h2>{t('weeklyRecap.title')}</h2>
          <dl className="share-progress-page__stats">
            <div>
              <dt>{t('weeklyRecap.doneTasks')}</dt>
              <dd>{view.weeklyRecap.doneTaskCount}</dd>
            </div>
            <div>
              <dt>{t('weeklyRecap.openTasks')}</dt>
              <dd>{view.weeklyRecap.openTaskCount}</dd>
            </div>
            <div>
              <dt>{t('weeklyRecap.specs')}</dt>
              <dd>{view.weeklyRecap.specCount}</dd>
            </div>
            <div>
              <dt>{t('weeklyRecap.proofReports')}</dt>
              <dd>{view.weeklyRecap.proofReportCount}</dd>
            </div>
          </dl>
        </section>

        {view.intentSnapshot ? (
          <section className="share-progress-page__card">
            <h2>{t('share.intent.previewTitle')}</h2>
            {view.intentSummary ? (
              <p className="share-progress-page__intent-summary" data-testid="share-progress-intent">
                {view.intentSummary}
              </p>
            ) : null}
            <ul className="share-progress-page__spec-list">
              {view.intentSnapshot.specs.map((spec) => {
                const pct =
                  spec.totalTasks > 0 ? Math.round((spec.doneTasks / spec.totalTasks) * 100) : 0
                return (
                  <li key={spec.tasksPath}>
                    <div className="share-progress-page__spec-row">
                      <strong>{spec.slug}</strong>
                      <span>{t('shareProgress.specProgress', { done: spec.doneTasks, total: spec.totalTasks })}</span>
                    </div>
                    <div
                      className="share-progress-page__spec-progress"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            {intentGraph && graphNodes.length > 0 ? (
              <div className="share-progress-page__graph">
                <h3 className="share-progress-page__graph-title">{t('shareProgress.specTree')}</h3>
                <ShareIntentGraph graph={intentGraph} />
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <section className="share-progress-page__card share-progress-page__proof">
        <h2>{t('share.progress.proofPreview')}</h2>
        {proofHtmlFiles.length > 0 ? (
          <>
            <select
              className="share-select"
              value={proofPreviewPath ?? proofHtmlFiles[proofHtmlFiles.length - 1]?.name ?? ''}
              onChange={(event) => setProofPreviewPath(event.target.value)}
            >
              {proofHtmlFiles.map((file) => (
                <option key={file.name} value={file.name}>
                  {file.name}
                </option>
              ))}
            </select>
            <iframe
              className="proof-preview-frame proof-preview-frame--page"
              title={t('share.progress.proofPreview')}
              sandbox=""
              srcDoc={proofPreview?.content ?? ''}
            />
          </>
        ) : (
          <p>{t('share.progress.noProof')}</p>
        )}
      </section>

      <section className="share-progress-page__card">
        <h2>{t('shareProgress.comments')}</h2>
        <ul className="share-progress-page__comments">
          {comments.length === 0 ? <li>{t('shareProgress.commentsEmpty')}</li> : null}
          {comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.author}</strong>
              <span>{comment.body}</span>
            </li>
          ))}
        </ul>
        {canComment ? (
          <div className="share-progress-page__comment-form">
            <input
              className="form-input"
              placeholder={t('shareProgress.commentAuthor')}
              value={commentAuthor}
              onChange={(event) => setCommentAuthor(event.target.value)}
            />
            <textarea
              className="share-code-textarea"
              placeholder={t('shareProgress.commentBody')}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (!commentBody.trim()) return
                addShareProgressComment(shareId, { author: commentAuthor, body: commentBody })
                setCommentBody('')
                setCommentsTick((value) => value + 1)
              }}
            >
              {t('shareProgress.commentSubmit')}
            </button>
          </div>
        ) : (
          <UpgradeEntitlementHint
            feature={authService.getCurrentUser() ? 'shareProgressComments' : undefined}
            messageKey={
              authService.getCurrentUser() ? undefined : 'shareProgress.commentsLoginRequired'
            }
            onUpgrade={
              authService.getCurrentUser() ? () => setShowSubscriptionModal(true) : undefined
            }
            compact
          />
        )}
      </section>
    </div>
  )
})
