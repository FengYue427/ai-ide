import { DEFAULT_JOBS_PER_CRON_TICK } from './backgroundJobTypes'
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
  const limit = options.limit ?? DEFAULT_JOBS_PER_CRON_TICK
  const staleFailed = await failStaleRunningBackgroundJobs()

  const result: ProcessBackgroundJobsResult = {
    staleFailed,
    processed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    jobIds: [],
  }

  for (let i = 0; i < limit; i++) {
    const job = await claimNextQueuedBackgroundJob()
    if (!job) break

    result.processed++
    result.jobIds.push(job.id)

    const run = await executeBackgroundJob(job)
    if (run.outcome === 'succeeded') result.succeeded++
    else if (run.outcome === 'cancelled') result.cancelled++
    else result.failed++
  }

  return result
}
