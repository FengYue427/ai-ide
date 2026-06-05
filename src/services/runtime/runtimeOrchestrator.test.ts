import { afterEach, describe, expect, it } from 'vitest'
import { clearRuntimeEvents, getRecentRuntimeEvents } from './runtimeEventBus'
import { enqueueRuntimeIntent, getOrchestratorMode } from './runtimeOrchestrator'

describe('runtimeOrchestrator stub', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('runs in stub mode', () => {
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
})
