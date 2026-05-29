import type { BackgroundJob } from '@prisma/client'
import type {
  BackgroundJobProgress,
  BackgroundJobResultPayload,
  BackgroundJobWorkerMode,
} from './backgroundJobTypes'
import { isJobRuntimeExpired, resolveBackgroundJobWorkerMode } from './backgroundJobTypes'
import { enrichResultWithCloudWriteback } from './backgroundJobCloudWriteback'
import {
  completeBackgroundJobFailed,
  completeBackgroundJobSucceeded,
  getBackgroundJobById,
  updateBackgroundJobProgress,
} from './backgroundJobsService'

export type BackgroundJobRunContext = {
  isCancelled: () => Promise<boolean>
  setProgress: (progress: BackgroundJobProgress) => Promise<void>
  startedAt: Date
}

export type BackgroundJobRunOutcome =
  | { kind: 'succeeded'; result: BackgroundJobResultPayload }
  | { kind: 'failed'; error: string }
  | { kind: 'cancelled' }
  | { kind: 'timeout' }

function promptPreview(prompt: string, max = 200): string {
  const trimmed = prompt.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

/** F2 dev path — no LLM / workspace; validates worker plumbing. */
export async function runDummyBackgroundJob(
  job: BackgroundJob,
  ctx: BackgroundJobRunContext,
): Promise<BackgroundJobRunOutcome> {
  await ctx.setProgress({ phase: 'dummy:start', updatedAt: new Date().toISOString() })

  if (await ctx.isCancelled()) return { kind: 'cancelled' }
  if (isJobRuntimeExpired(ctx.startedAt)) return { kind: 'timeout' }

  await ctx.setProgress({ phase: 'dummy:execute', round: 1, updatedAt: new Date().toISOString() })

  if (await ctx.isCancelled()) return { kind: 'cancelled' }

  const summary = `Dummy worker completed (${promptPreview(job.prompt, 120)})`
  const stamp = new Date().toISOString()
  const markerPath = `.aide/background-jobs/${job.id}.md`
  const markerContent = [
    '# Background job result',
    '',
    `- **Completed**: ${stamp}`,
    `- **Job**: ${job.id}`,
    '',
    '## Prompt excerpt',
    '',
    promptPreview(job.prompt, 800),
    '',
  ].join('\n')

  return {
    kind: 'succeeded',
    result: {
      mode: 'dummy',
      summary,
      rounds: 1,
      pendingChanges: [
        {
          path: markerPath,
          content: markerContent,
          language: 'markdown',
        },
      ],
    },
  }
}

/**
 * Full agent loop on server — not wired in v1.1.2 F2 (browser workspace deps).
 * F4+ will mount cloud workspace + agent execution here.
 */
export async function runAgentBackgroundJob(
  _job: BackgroundJob,
  _ctx: BackgroundJobRunContext,
): Promise<BackgroundJobRunOutcome> {
  return {
    kind: 'failed',
    error: 'AGENT_WORKER_NOT_IMPLEMENTED',
  }
}

export async function runBackgroundJobWorker(
  job: BackgroundJob,
  ctx: BackgroundJobRunContext,
  mode: BackgroundJobWorkerMode = resolveBackgroundJobWorkerMode(),
): Promise<BackgroundJobRunOutcome> {
  if (mode === 'agent') return runAgentBackgroundJob(job, ctx)
  return runDummyBackgroundJob(job, ctx)
}

export async function executeBackgroundJob(job: BackgroundJob): Promise<{
  jobId: string
  outcome: BackgroundJobRunOutcome['kind']
}> {
  const startedAt = job.startedAt ?? new Date()
  const ctx: BackgroundJobRunContext = {
    startedAt,
    setProgress: async (progress) => {
      await updateBackgroundJobProgress(job.id, progress)
    },
    isCancelled: async () => {
      const current = await getBackgroundJobById(job.id)
      return current?.status === 'cancelled'
    },
  }

  const mode = resolveBackgroundJobWorkerMode()
  const outcome = await runBackgroundJobWorker(job, ctx, mode)

  switch (outcome.kind) {
    case 'succeeded': {
      let result = outcome.result
      try {
        result = await enrichResultWithCloudWriteback(job.userId, job.repoKey, result)
      } catch (error) {
        console.error('[Jobs] Cloud writeback failed:', error)
      }
      const updated = await completeBackgroundJobSucceeded(job.id, result)
      return { jobId: job.id, outcome: updated ? 'succeeded' : 'cancelled' }
    }
    case 'failed': {
      await completeBackgroundJobFailed(job.id, outcome.error)
      return { jobId: job.id, outcome: 'failed' }
    }
    case 'timeout': {
      await completeBackgroundJobFailed(job.id, 'JOB_TIMEOUT')
      return { jobId: job.id, outcome: 'failed' }
    }
    case 'cancelled':
      return { jobId: job.id, outcome: 'cancelled' }
    default:
      return { jobId: job.id, outcome: 'failed' }
  }
}
