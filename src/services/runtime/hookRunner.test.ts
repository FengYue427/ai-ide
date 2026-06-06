import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearRuntimeEvents } from './runtimeEventBus'
import { runHooksForEvent } from './hookRunner'
import { isDesktopApp, getDesktopApi } from '../desktopBridge'

vi.mock('../desktopBridge', () => ({
  isDesktopApp: vi.fn(() => false),
  getDesktopApi: vi.fn(() => null),
}))

const HOOKS = `version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: npm run test:local
  - id: after-queue
    on: queue.after
    run: enqueue
    spec: auth-refactor
    task: Fix acceptance
  - id: on-verify-fail
    on: verify.fail
    run: agent
    prompt: investigate failure
`

describe('hookRunner', () => {
  afterEach(() => {
    clearRuntimeEvents()
    vi.mocked(isDesktopApp).mockReturnValue(false)
    vi.mocked(getDesktopApi).mockReturnValue(undefined)
  })

  it('skips shell hooks in browser', async () => {
    const batch = await runHooksForEvent({
      event: 'queue.before',
      specName: 'auth-refactor',
      tasksPath: '.aide/specs/auth-refactor/tasks.md',
      hooksYamlContent: HOOKS,
    })

    expect(batch.outcomes).toHaveLength(1)
    expect(batch.outcomes[0]?.status).toBe('skip')
    expect(batch.shouldPauseQueue).toBe(false)
  })

  it('pauses queue when queue.before shell hook fails on desktop', async () => {
    vi.mocked(isDesktopApp).mockReturnValue(true)
    vi.mocked(getDesktopApi).mockReturnValue({
      runCommand: vi.fn(async () => ({ exitCode: 1 })),
    } as never)

    const batch = await runHooksForEvent({
      event: 'queue.before',
      specName: 'auth-refactor',
      tasksPath: '.aide/specs/auth-refactor/tasks.md',
      hooksYamlContent: HOOKS,
      workspaceRoot: '/tmp/project',
    })

    expect(batch.shouldPauseQueue).toBe(true)
    expect(batch.outcomes[0]?.status).toBe('fail')
  })

  it('returns enqueue intent for queue.after hooks', async () => {
    const batch = await runHooksForEvent({
      event: 'queue.after',
      specName: 'auth-refactor',
      tasksPath: '.aide/specs/auth-refactor/tasks.md',
      hooksYamlContent: HOOKS,
    })

    expect(batch.outcomes[0]?.enqueueIntent?.kind).toBe('spec')
    expect(batch.outcomes[0]?.enqueueIntent?.backfill?.taskText).toBe('Fix acceptance')
  })
})
