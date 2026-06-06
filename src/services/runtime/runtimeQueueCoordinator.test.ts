import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueuedSpecBackfill } from '../../store/ideStore'
import { clearRuntimeEvents } from './runtimeEventBus'
import {
  enqueueSpecTaskViaRuntime,
  onSpecQueueItemSucceeded,
  type FileLike,
  type SpecQueueCoordinatorDeps,
} from './runtimeQueueCoordinator'

vi.mock('../../lib/v15Features', () => ({
  isAideRuntimeProductionEnabled: vi.fn(() => false),
}))

vi.mock('../desktopBridge', () => ({
  isDesktopApp: () => false,
  getDesktopApi: () => null,
}))

function createDeps(overrides?: Partial<SpecQueueCoordinatorDeps>): SpecQueueCoordinatorDeps {
  let files: FileLike[] = [{ name: '.aide/specs/demo/tasks.md', content: '# Demo', language: 'markdown' }]
  let backfill: QueuedSpecBackfill | null = null
  const executions: Array<{ prompt: string; backfill: QueuedSpecBackfill }> = []

  return {
    getFiles: () => files,
    setFiles: (next) => {
      files = next
    },
    setQueuedChatPrompt: () => {},
    setQueuedSpecBackfill: (next) => {
      backfill = next
    },
    appendSpecExecution: (item) => {
      executions.push(item)
    },
    getSpecQueueDepth: () => executions.length,
    getPlanQueueDepth: () => 0,
    hasActiveSpecBackfill: () => Boolean(backfill),
    ...overrides,
  }
}

describe('runtimeQueueCoordinator', () => {
  beforeEach(async () => {
    const { isAideRuntimeProductionEnabled } = await import('../../lib/v15Features')
    vi.mocked(isAideRuntimeProductionEnabled).mockReturnValue(false)
  })

  afterEach(() => {
    clearRuntimeEvents()
  })

  it('enqueues spec task directly when production runtime is off', async () => {
    const deps = createDeps()
    const result = await enqueueSpecTaskViaRuntime(
      {
        tasksPath: '.aide/specs/demo/tasks.md',
        taskText: 'Implement login',
        specAcceptancePath: '.aide/specs/demo/acceptance.md',
        prompt: 'run task',
      },
      deps,
    )

    expect(result.accepted).toBe(true)
  })

  it('runs verify hooks in production mode', async () => {
    const { isAideRuntimeProductionEnabled } = await import('../../lib/v15Features')
    vi.mocked(isAideRuntimeProductionEnabled).mockReturnValue(true)

    const deps = createDeps({
      getFiles: () => [
        {
          name: '.aide/specs/demo/acceptance.md',
          content: '- [x] done',
          language: 'markdown',
        },
        {
          name: '.aide/specs/demo/tasks.md',
          content: '# Demo',
          language: 'markdown',
        },
      ],
    })

    const result = await onSpecQueueItemSucceeded(
      {
        taskPath: '.aide/specs/demo/tasks.md',
        taskText: 'Implement login',
        specAcceptancePath: '.aide/specs/demo/acceptance.md',
      },
      deps,
    )

    expect(result.verifyOk).toBe(true)
  })
})
