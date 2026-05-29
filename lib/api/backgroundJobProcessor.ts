import { DEFAULT_JOBS_PER_CRON_TICK, resolveBackgroundJobWorkerMode } from './backgroundJobTypes'
import {
  claimNextQueuedBackgroundJob,
  failStaleRunningBackgroundJobs,
} from './backgroundJobsService'
import { executeBackgroundJob } from './backgroundJobRunner'

export type ProcessBackgroundJobsResult = {
  staleFailed: number
  processed: number
  succeeded: number
  failed: number
  cancelled: number
  jobIds: string[]
  workerMode: string
  startedAt: string
  finishedAt: string
  durationMs: number
}

export type ProcessBackgroundJobsOptions = {
  limit?: number
}

/**
 * Cron worker entry — claim queued jobs and run until limit or queue empty.
 */
export async function processBackgroundJobs(
  options: ProcessBackgroundJobsOptions = {},
): Promise<ProcessBackgroundJobsResult> {
  const startedMs = Date.now()
  const startedAt = new Date(startedMs).toISOString()
  const workerMode = resolveBackgroundJobWorkerMode()
  const limit = options.limit ?? DEFAULT_JOBS_PER_CRON_TICK
  const staleFailed = await failStaleRunningBackgroundJobs()

  const result: ProcessBackgroundJobsResult = {
    staleFailed,
    processed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    jobIds: [],
    workerMode,
    startedAt,
    finishedAt: startedAt,
    durationMs: 0,
  }

  for (let i = 0; i < limit; i++) {
    const job = await claimNextQueuedBackgroundJob()
    if (!job) break

    result.processed++
    result.jobIds.push(job.id)

    const jobStarted = Date.now()
    const run = await executeBackgroundJob(job)
    const jobMs = Date.now() - jobStarted
    console.info('[Jobs process] job finished', {
      jobId: job.id,
      outcome: run.outcome,
      workerMode,
      durationMs: jobMs,
    })

    if (run.outcome === 'succeeded') result.succeeded++
    else if (run.outcome === 'cancelled') result.cancelled++
    else result.failed++
  }

  result.finishedAt = new Date().toISOString()
  result.durationMs = Date.now() - startedMs

  console.info('[Jobs process] tick complete', result)

  return result
}
