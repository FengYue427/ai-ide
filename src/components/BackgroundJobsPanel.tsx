import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, Clock, Copy, Eye, Loader2, RefreshCw, RotateCcw, Server, XCircle } from 'lucide-react'
import { useI18n } from '../i18n'
import type { TranslationKey } from '../i18n/translations'
import type { ToastKind } from './FeedbackCenter'
import { Toggle } from './ui/Toggle'
import {
  applyBackgroundJobToIde,
  buildAgentApplyQueueFromJob,
  getJobPendingFileChanges,
} from '../services/backgroundJobApplyService'
import { processBackgroundJobsSnapshot } from '../services/backgroundJobCompletionTracker'
import { authService } from '../services/authService'
import {
  loadBackgroundJobNotifyPrefs,
  saveBackgroundJobNotifyPrefs,
  type BackgroundJobNotifyPrefs,
} from '../services/backgroundJobNotifyPrefsService'
import { maybeAutoMarkPlanStepFromJob, tryMarkPlanStepFromBackgroundJob } from '../services/backgroundJobPlanBackfillService'
import { parsePlanBackgroundJobPrompt } from '../services/planExecutionService'
import {
  cancelBackgroundJob,
  createBackgroundJob,
  isActiveBackgroundJobStatus,
  isTerminalBackgroundJobStatus,
  listBackgroundJobs,
  type SerializedBackgroundJob,
} from '../services/backgroundJobsApiService'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { useIDEStore } from '../store/ideStore'
import { getClientEntitlements } from '../lib/clientPlanEntitlements'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'

const POLL_MS = 5_000

type JobListFilter = 'all' | 'active' | 'finished'

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
  const setFiles = useIDEStore((s) => s.setFiles)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const setBackgroundJobsActiveCount = useIDEStore((s) => s.setBackgroundJobsActiveCount)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const jobEntitlements = useMemo(
    () => getClientEntitlements(currentPlan ?? 'free'),
    [currentPlan],
  )
  const isTeamPlan = jobEntitlements.planName === 'enterprise'
  const batchMax = jobEntitlements.backgroundJobsBatchMax
  const unlimitedLabel = t('subscription.unlimited')
  const formatJobLimit = (value: number) => (value < 0 ? unlimitedLabel : String(value))
  const [jobs, setJobs] = useState<SerializedBackgroundJob[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [listFilter, setListFilter] = useState<JobListFilter>('all')
  const [notifyPrefs, setNotifyPrefs] = useState<BackgroundJobNotifyPrefs>(() => loadBackgroundJobNotifyPrefs())
  const mountedRef = useRef(true)
  const filesRef = useRef(files)
  filesRef.current = files

  const filteredJobs = useMemo(() => {
    if (listFilter === 'active') return jobs.filter((j) => isActiveBackgroundJobStatus(j.status))
    if (listFilter === 'finished') return jobs.filter((j) => isTerminalBackgroundJobStatus(j.status))
    return jobs
  }, [jobs, listFilter])

  const selected = useMemo(
    () => filteredJobs.find((j) => j.id === selectedId) ?? filteredJobs[0] ?? null,
    [filteredJobs, selectedId],
  )

  const selectedPlanMeta = useMemo(
    () => (selected ? parsePlanBackgroundJobPrompt(selected.prompt) : null),
    [selected],
  )

  const hasActiveJobs = jobs.some((j) => isActiveBackgroundJobStatus(j.status))

  useEffect(() => {
    saveBackgroundJobNotifyPrefs(notifyPrefs)
  }, [notifyPrefs])

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setJobs([])
      setBackgroundJobsActiveCount(0)
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
      const active = processBackgroundJobsSnapshot(next, {
        notify,
        t,
        onTerminal: (job) => {
          maybeAutoMarkPlanStepFromJob(
            filesRef.current,
            job,
            (nextFiles) => {
              setFiles(nextFiles)
              markWorkspaceHydrated()
            },
            notify,
            t,
          )
        },
      })
      setBackgroundJobsActiveCount(active)
      setJobs(next)
      setSelectedId((prev) => {
        if (prev && next.some((j) => j.id === prev)) return prev
        return next[0]?.id ?? null
      })
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [isLoggedIn, notify, setBackgroundJobsActiveCount, setFiles, t])

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

  const handleApplyToIde = async (job: SerializedBackgroundJob) => {
    setApplyingId(job.id)
    try {
      const { files: next, appliedCount } = applyBackgroundJobToIde(files, job)
      if (appliedCount === 0) {
        notify?.('info', t('backgroundJobs.applyToIdeEmpty'))
        return
      }
      setFiles(next)
      markWorkspaceHydrated()
      notify?.('success', t('backgroundJobs.applyToIdeOk'), t('backgroundJobs.applyToIdeOkDetail', { count: appliedCount }))
    } finally {
      setApplyingId(null)
    }
  }

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(true)
      notify?.('success', t('backgroundJobs.copyPromptOk'))
      window.setTimeout(() => setCopiedPrompt(false), 2000)
    } catch {
      notify?.('error', t('backgroundJobs.copyPromptFailed'))
    }
  }

  const handleRetry = async (job: SerializedBackgroundJob) => {
    setRetryingId(job.id)
    try {
      const { job: created, error } = await createBackgroundJob(
        { prompt: job.prompt, repoKey: job.repoKey ?? 'default' },
        t,
      )
      if (error || !created) {
        notify?.('error', t('backgroundJobs.retryFailed'), error)
        return
      }
      notify?.('success', t('backgroundJobs.retryQueued'))
      setSelectedId(created.id)
      void refresh()
    } finally {
      setRetryingId(null)
    }
  }

  const handleMarkPlanStep = (job: SerializedBackgroundJob) => {
    const result = tryMarkPlanStepFromBackgroundJob(files, job)
    if (!result) {
      notify?.('info', t('backgroundJobs.planStepAlreadyDone'))
      return
    }
    setFiles(result.files)
    markWorkspaceHydrated()
    notify?.(
      'success',
      t('backgroundJobs.planStepMarked'),
      t('backgroundJobs.planStepMarkedDetail', { path: result.planPath, step: result.stepText }),
    )
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
      <div
        className={`background-jobs-panel__quota${isTeamPlan ? ' background-jobs-panel__quota--team' : ''}`}
        data-testid="background-jobs-quota"
      >
        <span>
          {jobEntitlements.planName === 'free'
            ? t('backgroundJobs.limitsFree', {
                daily: jobEntitlements.backgroundJobsPerDay,
                concurrent: jobEntitlements.backgroundJobsMaxActive,
              })
            : jobEntitlements.planName === 'pro'
              ? t('backgroundJobs.limitsPro', {
                  daily: jobEntitlements.backgroundJobsPerDay,
                  concurrent: jobEntitlements.backgroundJobsMaxActive,
                  batch: batchMax,
                })
              : t('backgroundJobs.limitsTeam', {
                  daily: formatJobLimit(jobEntitlements.backgroundJobsPerDay),
                  concurrent: jobEntitlements.backgroundJobsMaxActive,
                  batch: batchMax,
                })}
        </span>
        {isTeamPlan ? (
          <span className="background-jobs-panel__team-badge">{t('entitlements.card.teamPlus')}</span>
        ) : null}
        {!isTeamPlan && onOpenSubscription ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenSubscription}>
            {batchMax === 0 ? t('backgroundJobs.upgradePro') : t('entitlements.card.upgradeTeam')}
          </button>
        ) : null}
      </div>
      {batchMax === 0 ? (
        <UpgradeEntitlementHint compact feature="planBatch" onUpgrade={onOpenSubscription} />
      ) : null}
      <div className="background-jobs-panel__toolbar">
        <span className="background-jobs-panel__hint">
          {t('backgroundJobs.hint')}
        </span>
        <div className="background-jobs-panel__toolbar-actions">
          <label className="background-jobs-notify-toggle" title={t('backgroundJobs.autoMarkPlanStep')}>
            <Check size={12} />
            <Toggle
              checked={notifyPrefs.autoMarkPlanStep}
              onChange={() =>
                setNotifyPrefs((prev) => ({ ...prev, autoMarkPlanStep: !prev.autoMarkPlanStep }))
              }
              aria-label={t('backgroundJobs.autoMarkPlanStep')}
            />
          </label>
          <label className="background-jobs-notify-toggle" title={t('backgroundJobs.notifyOnComplete')}>
            <Bell size={12} />
            <Toggle
              checked={notifyPrefs.notifyOnComplete}
              onChange={() =>
                setNotifyPrefs((prev) => ({ ...prev, notifyOnComplete: !prev.notifyOnComplete }))
              }
              aria-label={t('backgroundJobs.notifyOnComplete')}
            />
          </label>
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
      </div>

      <div className="background-jobs-filter" role="tablist" aria-label={t('backgroundJobs.filterLabel')}>
        {(['all', 'active', 'finished'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={listFilter === filter}
            className={`background-jobs-filter__btn ${listFilter === filter ? 'background-jobs-filter__btn--active' : ''}`}
            onClick={() => setListFilter(filter)}
          >
            {t(`backgroundJobs.filter.${filter}`)}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="background-jobs-panel--empty">
          <Clock size={24} style={{ opacity: 0.45 }} />
          <p>{t('backgroundJobs.empty')}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="background-jobs-panel--empty">
          <Clock size={24} style={{ opacity: 0.45 }} />
          <p>{t('backgroundJobs.filterEmpty')}</p>
        </div>
      ) : (
        <div className="background-jobs-panel__body">
          <ul className="background-jobs-list" role="list">
            {filteredJobs.map((job) => (
              <li key={job.id} className="background-jobs-list__row">
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
                {(job.status === 'failed' || job.status === 'cancelled') ? (
                  <button
                    type="button"
                    className="background-jobs-list__retry"
                    title={t('backgroundJobs.retry')}
                    disabled={retryingId === job.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedId(job.id)
                      void handleRetry(job)
                    }}
                  >
                    {retryingId === job.id ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                  </button>
                ) : null}
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

              <div className="background-jobs-detail__prompt-row">
                <pre className="background-jobs-detail__prompt">{selected.prompt}</pre>
                <button
                  type="button"
                  className="chat-btn-ghost"
                  title={t('backgroundJobs.copyPrompt')}
                  onClick={() => void handleCopyPrompt(selected.prompt)}
                >
                  <Copy size={14} style={{ marginRight: 6 }} />
                  {copiedPrompt ? t('backgroundJobs.copyPromptOk') : t('backgroundJobs.copyPrompt')}
                </button>
              </div>

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

              {selected.status === 'succeeded' && selectedPlanMeta ? (
                <div className="background-jobs-detail__meta">
                  {t('backgroundJobs.planSource')}: {selectedPlanMeta.planPath}
                </div>
              ) : null}

              {getJobPendingFileChanges(selected).length > 0 &&
              selected.status === 'succeeded' ? (
                <div className="background-jobs-detail__actions">
                  <button
                    type="button"
                    className="chat-btn-primary-sm"
                    disabled={applyingId === selected.id}
                    onClick={() => void handleApplyToIde(selected)}
                  >
                    {applyingId === selected.id ? (
                      <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                    ) : null}
                    {t('backgroundJobs.applyToIde')}
                  </button>
                  <button
                    type="button"
                    className="chat-btn-ghost"
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

              {selected.status === 'succeeded' && selectedPlanMeta ? (
                <div className="background-jobs-detail__actions">
                  <button
                    type="button"
                    className="chat-btn-ghost"
                    onClick={() => handleMarkPlanStep(selected)}
                  >
                    <Check size={14} style={{ marginRight: 6 }} />
                    {t('backgroundJobs.markPlanStep')}
                  </button>
                </div>
              ) : null}

              {(selected.status === 'failed' || selected.status === 'cancelled') ? (
                <div className="background-jobs-detail__actions">
                  <button
                    type="button"
                    className="chat-btn-primary-sm"
                    disabled={retryingId === selected.id}
                    onClick={() => void handleRetry(selected)}
                  >
                    {retryingId === selected.id ? (
                      <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                    ) : (
                      <RotateCcw size={14} style={{ marginRight: 6 }} />
                    )}
                    {t('backgroundJobs.retry')}
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
