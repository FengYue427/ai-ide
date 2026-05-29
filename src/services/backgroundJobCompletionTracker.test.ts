import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  countActiveBackgroundJobs,
  processBackgroundJobsSnapshot,
  resetBackgroundJobCompletionTracker,
} from './backgroundJobCompletionTracker'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'

function job(id: string, status: SerializedBackgroundJob['status']): SerializedBackgroundJob {
  return {
    id,
    status,
    repoKey: 'default',
    prompt: `task ${id}`,
    progress: null,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: status === 'succeeded' ? new Date().toISOString() : null,
  }
}

describe('backgroundJobCompletionTracker', () => {
  beforeEach(() => {
    resetBackgroundJobCompletionTracker()
  })

  it('counts active jobs', () => {
    const jobs = [job('a', 'running'), job('b', 'succeeded'), job('c', 'queued')]
    expect(countActiveBackgroundJobs(jobs)).toBe(2)
  })

  it('notifies when job transitions to terminal', () => {
    const notify = vi.fn()
    const t = (key: string) => key

    processBackgroundJobsSnapshot([job('1', 'running')], { notify, t })
    expect(notify).not.toHaveBeenCalled()

    processBackgroundJobsSnapshot([job('1', 'succeeded')], { notify, t })
    expect(notify).toHaveBeenCalledWith(
      'success',
      'backgroundJobs.notifySucceeded',
      'task 1',
      expect.objectContaining({ onClick: expect.any(Function) }),
    )
  })
})
