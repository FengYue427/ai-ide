import type { BackgroundJob } from '@prisma/client'
import { runBackgroundAgentLoop } from './backgroundAgentLoop'
import { resolveBackgroundAgentAiConfig } from './backgroundAgentConfig'
import { BackgroundAgentWorkspace } from './backgroundAgentWorkspace'
import type {
  BackgroundJobProgress,
  BackgroundJobResultPayload,
  BackgroundJobWorkerMode,
} from './backgroundJobTypes'
import { isJobRuntimeExpired, resolveBackgroundJobWorkerMode } from './backgroundJobTypes'
import {
  enrichResultWithCloudWriteback,
  parseWorkspaceFilesJson,
} from './backgroundJobCloudWriteback'
import {
  completeBackgroundJobFailed,
  completeBackgroundJobSucceeded,
  getBackgroundJobById,
  updateBackgroundJobProgress,
} from './backgroundJobsService'
import { ensureDefaultWorkspace, getWorkspaceByName } from './workspacesService'

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

/** Cloud workspace agent loop (v1.1.2.5). Requires BACKGROUND_AGENT_API_KEY. */
export async function runAgentBackgroundJob(
  job: BackgroundJob,
  ctx: BackgroundJobRunContext,
): Promise<BackgroundJobRunOutcome> {
  const stamp = () => new Date().toISOString()

  await ctx.setProgress({ phase: 'agent:load', updatedAt: stamp() })

  if (await ctx.isCancelled()) return { kind: 'cancelled' }
  if (isJobRuntimeExpired(ctx.startedAt)) return { kind: 'timeout' }

  const workspaceName = (job.repoKey?.trim() || 'default').slice(0, 256)
  let workspaceRow = await getWorkspaceByName(job.userId, workspaceName)
  if (!workspaceRow && workspaceName === 'default') {
    workspaceRow = await ensureDefaultWorkspace(job.userId)
  }
  if (!workspaceRow) {
    return { kind: 'failed', error: 'WORKSPACE_NOT_FOUND' }
  }

  const ai = resolveBackgroundAgentAiConfig(workspaceRow.settings)
  if (!ai.ok) {
    return { kind: 'failed', error: ai.error }
  }

  const files = parseWorkspaceFilesJson(workspaceRow.files)
  const workspace = new BackgroundAgentWorkspace(files)

  await ctx.setProgress({ phase: 'agent:start', updatedAt: stamp() })

  try {
    const loop = await runBackgroundAgentLoop(
      job.userId,
      ai.config,
      workspace,
      job.prompt,
      {
        shouldStop: async () =>
          (await ctx.isCancelled()) || isJobRuntimeExpired(ctx.startedAt),
        onRound: async (round) => {
          if (isJobRuntimeExpired(ctx.startedAt)) return
          await ctx.setProgress({
            phase: 'agent:round',
            round,
            updatedAt: stamp(),
          })
        },
      },
    )

    if (await ctx.isCancelled()) return { kind: 'cancelled' }
    if (isJobRuntimeExpired(ctx.startedAt)) return { kind: 'timeout' }

    const pendingChanges = workspace.getPendingChanges()
    const summary =
      loop.finalContent.trim() ||
      (pendingChanges.length > 0
        ? `Background agent updated ${pendingChanges.length} file(s) in ${workspaceName}.`
        : `Background agent completed with no file changes (${loop.toolCalls} tool call(s)).`)

    await ctx.setProgress({ phase: 'agent:done', round: loop.rounds, updatedAt: stamp() })

    return {
      kind: 'succeeded',
      result: {
        mode: 'agent',
        summary: summary.slice(0, 4000),
        rounds: loop.rounds,
        pendingChanges,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Jobs] Agent worker failed:', job.id, message)
    return { kind: 'failed', error: message.slice(0, 500) }
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
