import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearRuntimeEvents, getRecentRuntimeEvents } from './runtimeEventBus'
import { enqueueRuntimeIntent, enqueueSpecRuntimeIntent, getOrchestratorMode } from './runtimeOrchestrator'

vi.mock('../../lib/v15Features', () => ({
  isAideRuntimeProductionEnabled: vi.fn(() => false),
}))

vi.mock('../desktopBridge', () => ({
  isDesktopApp: () => false,
  getDesktopApi: () => null,
}))

describe('runtimeOrchestrator', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('runs in stub mode by default', () => {
    expect(getOrchestratorMode()).toBe('stub')
  })

  it('accepts intent and publishes queue.progress without draining queue', () => {
    const result = enqueueRuntimeIntent({
      kind: 'spec',
      targetPath: '.aide/specs/demo/tasks.md',
      prompt: 'run first task',
      source: 'chat',
    })
    expect(result.accepted).toBe(true)
    expect(result.mode).toBe('stub')
    expect(result.intentId).toMatch(/^stub-intent-/)
    expect(getRecentRuntimeEvents()[0]?.message).toContain('demo/tasks.md')
  })

  it('dual-writes queue in production mode', async () => {
    const { isAideRuntimeProductionEnabled } = await import('../../lib/v15Features')
    vi.mocked(isAideRuntimeProductionEnabled).mockReturnValue(true)

    let prompt = ''
    let backfill: { taskPath: string; taskText: string; specAcceptancePath: string } | null = null

    const result = await enqueueSpecRuntimeIntent(
      {
        kind: 'spec',
        targetPath: '.aide/specs/demo/tasks.md',
        prompt: 'run first task',
        source: 'chat',
        backfill: {
          taskPath: '.aide/specs/demo/tasks.md',
          taskText: 'Implement login',
          specAcceptancePath: '.aide/specs/demo/acceptance.md',
        },
      },
      {
        writeImmediate: (payload) => {
          prompt = payload.prompt
          backfill = payload.backfill
        },
        appendExecution: () => {},
        getQueueDepth: () => ({ specPending: 0, planPending: 0 }),
        getFiles: () => [],
        setFiles: () => {},
      },
    )

    expect(result.accepted).toBe(true)
    expect(result.mode).toBe('production')
    expect(prompt).toBe('run first task')
    expect(backfill).not.toBeNull()
    expect(backfill!.taskText).toBe('Implement login')
  })
})
