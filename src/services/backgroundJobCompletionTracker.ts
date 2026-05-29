import type { TranslateFn } from '../i18n'
import type { TranslationKey } from '../i18n/translations'
import type { ToastKind } from '../components/FeedbackCenter'
import {
  isActiveBackgroundJobStatus,
  isTerminalBackgroundJobStatus,
  type BackgroundJobStatus,
  type SerializedBackgroundJob,
} from './backgroundJobsApiService'
import {
  loadBackgroundJobNotifyPrefs,
  notifyBackgroundJobDesktop,
} from './backgroundJobNotifyPrefsService'

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

let lastStatuses = new Map<string, BackgroundJobStatus>()

export function resetBackgroundJobCompletionTracker(): void {
  lastStatuses = new Map()
}

export function countActiveBackgroundJobs(jobs: SerializedBackgroundJob[]): number {
  return jobs.filter((j) => isActiveBackgroundJobStatus(j.status)).length
}

function terminalNotifyKeys(
  status: BackgroundJobStatus,
): { toast: TranslationKey; desktop: TranslationKey } | null {
  if (status === 'succeeded') {
    return { toast: 'backgroundJobs.notifySucceeded', desktop: 'backgroundJobs.notifyDesktopSucceeded' }
  }
  if (status === 'failed') {
    return { toast: 'backgroundJobs.notifyFailed', desktop: 'backgroundJobs.notifyDesktopFailed' }
  }
  if (status === 'cancelled') {
    return { toast: 'backgroundJobs.notifyCancelled', desktop: 'backgroundJobs.notifyDesktopCancelled' }
  }
  return null
}

export function processBackgroundJobsSnapshot(
  jobs: SerializedBackgroundJob[],
  ctx: {
    notify?: NotifyFn
    t: TranslateFn
    onTerminal?: (job: SerializedBackgroundJob) => void
  },
): number {
  const prefs = loadBackgroundJobNotifyPrefs()
  const seen = new Set<string>()

  for (const job of jobs) {
    seen.add(job.id)
    const prev = lastStatuses.get(job.id)
    const next = job.status
    lastStatuses.set(job.id, next)

    if (!prev || !isActiveBackgroundJobStatus(prev) || !isTerminalBackgroundJobStatus(next)) {
      continue
    }

    const keys = terminalNotifyKeys(next)
    if (!keys) continue

    const snippet = job.prompt.trim().slice(0, 72)
    const detail = snippet + (job.prompt.length > 72 ? '…' : '')
    ctx.notify?.(next === 'succeeded' ? 'success' : next === 'failed' ? 'error' : 'info', ctx.t(keys.toast), detail)

    if (prefs.notifyOnComplete) {
      notifyBackgroundJobDesktop(ctx.t(keys.desktop), detail)
    }

    ctx.onTerminal?.(job)
  }

  for (const id of [...lastStatuses.keys()]) {
    if (!seen.has(id)) lastStatuses.delete(id)
  }

  return countActiveBackgroundJobs(jobs)
}
