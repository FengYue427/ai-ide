import type { TranslateFn } from '../i18n'
import {
  buildPlanBackgroundJobPrompt,
  dedupePlanSteps,
  isPlanStepQueuedInJobs,
  type PlanStepInput,
} from './planExecutionService'
import {
  createBackgroundJobsBatch,
  listBackgroundJobs,
  type SerializedBackgroundJob,
} from './backgroundJobsApiService'

export type QueuePlanBackgroundJobsResult = {
  created: number
  skippedDuplicate: number
  skippedEmpty: number
  jobs: SerializedBackgroundJob[]
  error?: string
}

function normalizeRepoKey(repoKey?: string | null): string {
  return (repoKey?.trim() || 'default').slice(0, 256)
}

/**
 * Prepare plan steps for background queue: in-step dedupe + skip steps already queued/running.
 */
export function preparePlanStepsForBackgroundJobs(
  planPath: string,
  steps: PlanStepInput[],
  existingJobs: SerializedBackgroundJob[],
): { steps: PlanStepInput[]; skippedDuplicate: number; skippedEmpty: number } {
  const deduped = dedupePlanSteps(steps)
  const skippedEmpty = Math.max(0, steps.length - deduped.length)

  const pending: PlanStepInput[] = []
  let skippedDuplicate = 0
  for (const step of deduped) {
    if (isPlanStepQueuedInJobs(existingJobs, planPath, step.text)) {
      skippedDuplicate++
      continue
    }
    pending.push(step)
  }

  return { steps: pending, skippedDuplicate, skippedEmpty }
}

export async function queuePlanStepsAsBackgroundJobs(
  planPath: string,
  steps: PlanStepInput[],
  options?: {
    repoKey?: string | null
    t?: TranslateFn
    existingJobs?: SerializedBackgroundJob[]
  },
): Promise<QueuePlanBackgroundJobsResult> {
  const repoKey = normalizeRepoKey(options?.repoKey)
  const existing =
    options?.existingJobs ?? (await listBackgroundJobs(100)).jobs
  const prepared = preparePlanStepsForBackgroundJobs(planPath, steps, existing)

  if (prepared.steps.length === 0) {
    return {
      created: 0,
      skippedDuplicate: prepared.skippedDuplicate,
      skippedEmpty: prepared.skippedEmpty,
      jobs: [],
    }
  }

  const prompts = prepared.steps.map((step) => buildPlanBackgroundJobPrompt(planPath, step.text))
  const batch = await createBackgroundJobsBatch(
    { prompts, repoKey },
    options?.t,
  )

  return {
    created: batch.created,
    skippedDuplicate: prepared.skippedDuplicate + (batch.skipped ?? 0),
    skippedEmpty: prepared.skippedEmpty,
    jobs: batch.jobs,
    error: batch.error,
  }
}
