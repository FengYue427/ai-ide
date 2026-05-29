import { describe, expect, it } from 'vitest'
import {
  applyBackgroundJobToIde,
  buildAgentApplyQueueFromJob,
  getJobPendingFileChanges,
} from './backgroundJobApplyService'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'

function job(overrides: Partial<SerializedBackgroundJob> = {}): SerializedBackgroundJob {
  return {
    id: 'j1',
    status: 'succeeded',
    repoKey: 'default',
    prompt: 'test',
    progress: null,
    result: {
      mode: 'dummy',
      summary: 'ok',
      pendingChanges: [{ path: 'src/a.ts', content: 'new', language: 'typescript' }],
    },
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('backgroundJobApplyService', () => {
  it('extracts pending file changes', () => {
    const changes = getJobPendingFileChanges(job())
    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('src/a.ts')
  })

  it('builds agent apply queue', () => {
    const queue = buildAgentApplyQueueFromJob(job(), [{ name: 'src/a.ts', content: 'old', language: 'typescript' }])
    expect(queue[0]?.newContent).toBe('new')
    expect(queue[0]?.oldContent).toBe('old')
  })

  it('applies job changes to ide files', () => {
    const files = [{ name: 'src/a.ts', content: 'old', language: 'typescript' }]
    const { files: next, appliedCount } = applyBackgroundJobToIde(files, job())
    expect(appliedCount).toBe(1)
    expect(next.find((f) => f.name === 'src/a.ts')?.content).toBe('new')
  })
})
