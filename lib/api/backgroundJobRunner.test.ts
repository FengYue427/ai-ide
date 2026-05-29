import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BackgroundJob } from '@prisma/client'
import { isJobRuntimeExpired } from './backgroundJobTypes'
import { runAgentBackgroundJob, runDummyBackgroundJob } from './backgroundJobRunner'

vi.mock('./workspacesService', () => ({
  getWorkspaceByName: vi.fn(async () => ({
    name: 'default',
    files: JSON.stringify([{ name: 'hello.txt', content: 'hi' }]),
    settings: '{}',
  })),
  ensureDefaultWorkspace: vi.fn(),
}))

vi.mock('./backgroundAgentLoop', () => ({
  runBackgroundAgentLoop: vi.fn(async () => ({
    finalContent: 'Done.',
    rounds: 2,
    toolCalls: 3,
  })),
}))

vi.mock('./backgroundAgentConfig', () => ({
  resolveBackgroundAgentAiConfig: vi.fn(() => ({
    ok: true,
    config: {
      provider: 'deepseek',
      apiKey: 'sk-test',
      model: 'deepseek-v4-flash',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
    },
  })),
}))

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

  it('runAgentBackgroundJob succeeds when workspace and API key resolve', async () => {
    const progress: string[] = []
    const outcome = await runAgentBackgroundJob(mockJob(), {
      startedAt: new Date(),
      setProgress: async (p) => {
        progress.push(p.phase)
      },
      isCancelled: async () => false,
    })

    expect(outcome.kind).toBe('succeeded')
    if (outcome.kind === 'succeeded') {
      expect(outcome.result.mode).toBe('agent')
      expect(outcome.result.summary).toContain('Done')
    }
    expect(progress).toContain('agent:load')
    expect(progress).toContain('agent:done')
  })
})
