import { describe, expect, it, vi } from 'vitest'
import { buildPlanBackgroundJobPrompt } from './planExecutionService'
import {
  preparePlanStepsForBackgroundJobs,
  queuePlanStepsAsBackgroundJobs,
} from './planBackgroundJobsService'

vi.mock('./backgroundJobsApiService', () => ({
  listBackgroundJobs: vi.fn(async () => ({ jobs: [] })),
  createBackgroundJobsBatch: vi.fn(async () => ({
    jobs: [{ id: 'j1', status: 'queued', prompt: 'p', repoKey: 'default', progress: null, result: null, error: null, createdAt: '', startedAt: null, finishedAt: null }],
    created: 1,
  })),
}))

describe('planBackgroundJobsService', () => {
  it('dedupes steps and skips already queued plan jobs', () => {
    const planPath = '.aide/plans/foo.md'
    const prompt = buildPlanBackgroundJobPrompt(planPath, 'step one')
    const prepared = preparePlanStepsForBackgroundJobs(
      planPath,
      [
        { text: 'step one' },
        { text: 'step one' },
        { text: 'step two' },
      ],
      [
        {
          id: 'existing',
          status: 'queued',
          prompt,
          repoKey: 'default',
          progress: null,
          result: null,
          error: null,
          createdAt: '',
          startedAt: null,
          finishedAt: null,
        },
      ],
    )
    expect(prepared.steps).toEqual([{ text: 'step two' }])
    expect(prepared.skippedDuplicate).toBe(1)
    expect(prepared.skippedEmpty).toBe(1)
  })

  it('queues via batch API', async () => {
    const result = await queuePlanStepsAsBackgroundJobs('.aide/plans/foo.md', [{ text: 'a' }])
    expect(result.created).toBe(1)
    expect(result.jobs).toHaveLength(1)
  })
})
