import { describe, expect, it } from 'vitest'
import { buildPlanBackgroundJobPrompt } from './planExecutionService'
import { tryMarkPlanStepFromBackgroundJob } from './backgroundJobPlanBackfillService'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'

function job(prompt: string): SerializedBackgroundJob {
  return {
    id: 'j1',
    status: 'succeeded',
    repoKey: 'default',
    prompt,
    progress: null,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: new Date().toISOString(),
  }
}

describe('backgroundJobPlanBackfillService', () => {
  it('marks plan step from succeeded background job', () => {
    const planPath = '.aide/plans/foo.md'
    const files = [{ name: planPath, content: '- [ ] refactor chat\n', language: 'markdown' }]
    const result = tryMarkPlanStepFromBackgroundJob(
      files,
      job(buildPlanBackgroundJobPrompt(planPath, 'refactor chat')),
    )
    expect(result?.files[0]?.content).toContain('- [x] refactor chat')
  })
})
