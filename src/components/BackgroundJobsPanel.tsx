import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Eye, Loader2, RefreshCw, Server, XCircle } from 'lucide-react'
import { useI18n } from '../i18n'
import type { TranslationKey } from '../i18n/translations'
import type { ToastKind } from './FeedbackCenter'
import {
  buildAgentApplyQueueFromJob,
  getJobPendingFileChanges,
} from '../services/backgroundJobApplyService'
import { authService } from '../services/authService'
import {
  cancelBackgroundJob,
  isActiveBackgroundJobStatus,
  isTerminalBackgroundJobStatus,
  listBackgroundJobs,
  type SerializedBackgroundJob,
} from '../services/backgroundJobsApiService'
import { useIDEStore } from '../store/ideStore'

const POLL_MS = 5_000

interface BackgroundJobsPanelProps {
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  onRequestLogin?: () => void
  onOpenSubscription?: () => void
  isLoggedIn: boolean
}

function statusLabelKey(status: SerializedBackgroundJob['status']): TranslationKey {
  return `backgroundJobs.status.${status}` as TranslationKey
}

export default function BackgroundJobsPanel({
  notify,
  onRequestLogin,
  onOpenSubscription,
  isLoggedIn,
}: BackgroundJobsPanelProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const [jobs, setJobs] = useState<SerializedBackgroundJob[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const selected = useMemo(
    () => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId],
  )

  const hasActiveJobs = jobs.some((j) => isActiveBackgroundJobStatus(j.status))

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setJobs([])
      return
    }
    setLoading(true)
    try {
      const { jobs: next, error } = await listBackgroundJobs(50)
      if (!mountedRef.current) return
      if (error) {
        notify?.('error', t('backgroundJobs.loadFailed'), error)
        return
      }
      setJobs(next)
      setSelectedId((prev) => {
        if (prev && next.some((j) => j.id === prev)) return prev
        return next[0]?.id ?? null
      })
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [isLoggedIn, notify, t])

  useEffect(() => {
    mountedRef.current = true
    void refresh()
    return () => {
      mountedRef.current = false
    }
  }, [refresh])

  useEffect(() => {
    if (!isLoggedIn || !hasActiveJobs) return
    const timer = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [hasActiveJobs, isLoggedIn, refresh])

  const handleCancel = async (job: SerializedBackgroundJob) => {
    if (!isActiveBackgroundJobStatus(job.status)) return
    setCancellingId(job.id)
    try {
      const { job: updated, error } = await cancelBackgroundJob(job.id, t)
      if (error) {
        notify?.('error', t('backgroundJobs.cancelFailed'), error)
        return
      }
      if (updated) {
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
        notify?.('success', t('backgroundJobs.cancelled'))
      }
      void refresh()
    } finally {
      setCancellingId(null)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="background-jobs-panel background-jobs-panel--empty">
        <Server size={28} style={{ opacity: 0.5 }} />
        <p>{t('backgroundJobs.loginRequired')}</p>
        {onRequestLogin ? (
          <button type="button" className="chat-btn-primary-sm" onClick={onRequestLogin}>
            {t('backgroundJobs.login')}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="background-jobs-panel">
      <div className="background-jobs-panel__toolbar">
        <span className="background-jobs-panel__hint">
          {currentPlan === 'free' ? t('backgroundJobs.hintFree') : t('backgroundJobs.hint')}
        </span>
        <button
          type="button"
          className="chat-btn-ghost"
          onClick={() => void refresh()}
          disabled={loading}
          title={t('backgroundJobs.refresh')}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="background-jobs-panel--empty">
          <Clock size={24} style={{ opacity: 0.45 }} />
          <p>{t('backgroundJobs.empty')}</p>
        </div>
      ) : (
        <div className="background-jobs-panel__body">
          <ul className="background-jobs-list" role="list">
            {jobs.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  className={`background-jobs-list__item ${selected?.id === job.id ? 'background-jobs-list__item--active' : ''}`}
                  onClick={() => setSelectedId(job.id)}
                >
                  <span className={`background-jobs-status background-jobs-status--${job.status}`}>
                    {t(statusLabelKey(job.status))}
                  </span>
                  <span className="background-jobs-list__prompt">
                    {job.prompt.trim().slice(0, 80)}
                    {job.prompt.length > 80 ? '…' : ''}
                  </span>
                  <span className="background-jobs-list__time">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="background-jobs-detail">
              <div className="background-jobs-detail__header">
                <strong>{t('backgroundJobs.detailTitle')}</strong>
                <span className={`background-jobs-status background-jobs-status--${selected.status}`}>
                  {t(statusLabelKey(selected.status))}
                </span>
              </div>

              {selected.repoKey ? (
                <div className="background-jobs-detail__meta">
                  {t('backgroundJobs.repoKey')}: {selected.repoKey}
                </div>
              ) : null}

              {selected.progress?.phase ? (
                <div className="background-jobs-detail__meta">
                  {t('backgroundJobs.progress')}: {selected.progress.phase}
                  {selected.progress.round != null ? ` (#${selected.progress.round})` : ''}
                </div>
              ) : null}

              <pre className="background-jobs-detail__prompt">{selected.prompt}</pre>

              {selected.result?.summary ? (
                <div className="background-jobs-detail__result">
                  <strong>{t('backgroundJobs.result')}</strong>
                  <p>{selected.result.summary}</p>
                </div>
              ) : null}

              {selected.result?.cloudWriteback?.applied ? (
                <div className="background-jobs-detail__meta">
                  {t('backgroundJobs.cloudWritebackOk', {
                    count: selected.result.cloudWriteback.paths?.length ?? 0,
                    workspace: selected.result.cloudWriteback.workspace,
                  })}
                </div>
              ) : null}

              {getJobPendingFileChanges(selected).length > 0 &&
              selected.status === 'succeeded' ? (
                <div className="background-jobs-detail__actions">
                  <button
                    type="button"
                    className="chat-btn-primary-sm"
                    onClick={() => {
                      setAgentApplyQueue(buildAgentApplyQueueFromJob(selected, files))
                      setShowAgentApplyModal(true)
                    }}
                  >
                    <Eye size={14} style={{ marginRight: 6 }} />
                    {t('backgroundJobs.previewDiff')}
                  </button>
                  <button
                    type="button"
                    className="chat-btn-ghost"
                    onClick={async () => {
                      const workspace = selected.repoKey ?? 'default'
                      const loaded = await authService.loadWorkspace(workspace)
                      if (loaded?.files) {
                        notify?.(
                          'info',
                          t('backgroundJobs.reloadCloudHint'),
                          t('backgroundJobs.reloadCloudDetail', { workspace }),
                        )
                      } else {
                        notify?.('error', t('backgroundJobs.reloadCloudFailed'))
                      }
                    }}
                  >
                    {t('backgroundJobs.openCloud')}
                  </button>
                </div>
              ) : null}

              {selected.error ? (
                <div className="background-jobs-detail__error" role="alert">
                  <XCircle size={14} />
                  {selected.error}
                </div>
              ) : null}

              {isActiveBackgroundJobStatus(selected.status) ? (
                <button
                  type="button"
                  className="chat-btn-ghost"
                  disabled={cancellingId === selected.id}
                  onClick={() => void handleCancel(selected)}
                >
                  {cancellingId === selected.id ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    t('backgroundJobs.cancel')
                  )}
                </button>
              ) : null}

              {isTerminalBackgroundJobStatus(selected.status) && selected.finishedAt ? (
                <div className="background-jobs-detail__meta">
                  {t('backgroundJobs.finishedAt')}: {new Date(selected.finishedAt).toLocaleString()}
                </div>
              ) : null}

              {currentPlan === 'free' && onOpenSubscription ? (
                <button type="button" className="chat-btn-ghost" onClick={onOpenSubscription}>
                  {t('backgroundJobs.upgradePro')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
