import { afterEach, describe, expect, it } from 'vitest'
import {
  clearRuntimeEvents,
  getRecentRuntimeEvents,
  publishRuntimeEvent,
  subscribeRuntimeEvents,
} from './runtimeEventBus'

describe('runtimeEventBus', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('publishes and stores recent events', () => {
    publishRuntimeEvent({
      type: 'hook.start',
      at: '2026-06-05T10:00:00Z',
      message: 'pre-run-tests',
    })
    expect(getRecentRuntimeEvents()).toHaveLength(1)
    expect(getRecentRuntimeEvents()[0].message).toBe('pre-run-tests')
  })

  it('notifies subscribers', () => {
    const seen: string[] = []
    const unsub = subscribeRuntimeEvents((event) => seen.push(event.message))
    publishRuntimeEvent({
      type: 'queue.progress',
      at: 't',
      message: '2/5',
    })
    unsub()
    expect(seen).toEqual(['2/5'])
  })

  it('ignores unknown event types', () => {
    publishRuntimeEvent({
      type: 'unknown' as 'queue.progress',
      at: 't',
      message: 'x',
    })
    expect(getRecentRuntimeEvents()).toHaveLength(0)
  })
})
