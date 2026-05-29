import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BackgroundJob } from '@prisma/client'
import { isJobRuntimeExpired } from './backgroundJobTypes'
import { runDummyBackgroundJob } from './backgroundJobRunner'

function mockJob(overrides: Partial<BackgroundJob> = {}): BackgroundJob {
  return {
    id: 'job_test',
    userId: 'user_1',
    status: 'running',
    repoKey: 'default',
    prompt: 'fix the login bug',
    progress: null,
    result: null,
    error: null,
    createdAt: new Date('2026-05-29T00:00:00Z'),
    startedAt: new Date('2026-05-29T00:00:00Z'),
    finishedAt: null,
    ...overrides,
  }
}

describe('backgroundJobRunner', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runDummyBackgroundJob succeeds with summary', async () => {
    const progress: string[] = []
    const outcome = await runDummyBackgroundJob(mockJob(), {
      startedAt: new Date(),
      setProgress: async (p) => {
        progress.push(p.phase)
      },
      isCancelled: async () => false,
    })

    expect(outcome.kind).toBe('succeeded')
    if (outcome.kind === 'succeeded') {
      expect(outcome.result.mode).toBe('dummy')
      expect(outcome.result.summary).toContain('Dummy worker completed')
    }
    expect(progress).toContain('dummy:start')
    expect(progress).toContain('dummy:execute')
  })

  it('runDummyBackgroundJob respects cancellation', async () => {
    const outcome = await runDummyBackgroundJob(mockJob(), {
      startedAt: new Date(),
      setProgress: async () => {},
      isCancelled: async () => true,
    })
    expect(outcome.kind).toBe('cancelled')
  })

  it('detects runtime timeout via startedAt', () => {
    const started = new Date(Date.now() - 31 * 60 * 1000)
    expect(isJobRuntimeExpired(started)).toBe(true)
    expect(isJobRuntimeExpired(new Date())).toBe(false)
  })
})
