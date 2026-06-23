import type { Language } from '../i18n'
import type { TranslateFn } from '../i18n'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'
import {
  evaluateAutopilotBackgroundWatchStep,
  stopAutopilotBackgroundWatchState,
  type AutopilotBackgroundWatchState,
} from '../lib/autopilotBackgroundWatch'
import { parseSpecBackgroundJobPrompt, queueNextOpenSpecTaskAsBackgroundJob } from './specBackgroundAutopilotService'
import { countOpenSpecTasks } from './intentOs/autopilotLiteService'
import { tryMarkSpecTaskFromBackgroundJob } from './backgroundJobSpecBackfillService'
import { publishAutopilotBackgroundEvent } from './runtime/runtimeActivityPublishers'
import { syncLinkedShareProgressFromFiles } from '../lib/shareProgressWorkspaceSync'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import type { FileItem } from '../types/file'

export async function handleAutopilotBackgroundWatchOnJobTerminal(
  job: SerializedBackgroundJob,
  ctx: {
    files: FileItem[]
    setFiles: (files: FileItem[]) => void
    watch: AutopilotBackgroundWatchState | null
    setWatch: (watch: AutopilotBackgroundWatchState | null) => void
    language: Language
    t: TranslateFn
    workspaceKey?: string | null
  },
): Promise<void> {
  const meta = parseSpecBackgroundJobPrompt(job.prompt)
  if (!meta) return

  const watch = ctx.watch
  if (!watch?.active || watch.tasksPath !== meta.tasksPath) return

  if (job.status === 'failed' || job.status === 'cancelled') {
    const stopped = stopAutopilotBackgroundWatchState(watch, 'failed')
    ctx.setWatch(stopped.active ? stopped : null)
    publishAutopilotBackgroundEvent('stop', job.status, { tasksPath: watch.tasksPath })
    return
  }

  if (job.status !== 'succeeded') return

  let files = ctx.files
  const marked = tryMarkSpecTaskFromBackgroundJob(files, job)
  if (marked) {
    files = marked.files
    ctx.setFiles(files)
    const shareSync = syncLinkedShareProgressFromFiles(files, ctx.workspaceKey)
    if (shareSync) {
      emitAideLinkEvent('share-progress-local', { shareId: shareSync.shareId })
    }
  }

  const remaining = countOpenSpecTasks(files, watch.tasksPath)
  const decision = evaluateAutopilotBackgroundWatchStep({
    watch,
    remainingOpenTasks: remaining,
  })

  if (decision.action === 'stop') {
    const stopped = stopAutopilotBackgroundWatchState(watch, decision.reason)
    ctx.setWatch(stopped.active ? stopped : null)
    publishAutopilotBackgroundEvent('stop', decision.reason, { tasksPath: watch.tasksPath })
    return
  }

  const result = await queueNextOpenSpecTaskAsBackgroundJob(files, watch.tasksPath, {
    language: ctx.language,
    t: ctx.t,
  })

  if (result.skipped === 'no-open-task' || result.skipped === 'missing-file') {
    const stopped = stopAutopilotBackgroundWatchState(watch, 'completed')
    ctx.setWatch(stopped.active ? stopped : null)
    publishAutopilotBackgroundEvent('stop', 'completed', { tasksPath: watch.tasksPath })
    return
  }

  if (result.skipped === 'duplicate') {
    ctx.setWatch({ ...watch, lastJobId: job.id })
    return
  }

  if (result.error || !result.job) {
    const stopped = stopAutopilotBackgroundWatchState(watch, 'unavailable')
    ctx.setWatch(stopped.active ? stopped : null)
    publishAutopilotBackgroundEvent('stop', 'unavailable', { tasksPath: watch.tasksPath })
    return
  }

  ctx.setWatch({
    ...watch,
    stepsQueued: watch.stepsQueued + 1,
    lastJobId: result.job.id,
  })
  publishAutopilotBackgroundEvent('step', result.taskText?.slice(0, 80) ?? '', {
    tasksPath: watch.tasksPath,
    jobId: result.job.id,
  })
}
