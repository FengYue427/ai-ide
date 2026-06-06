import { afterEach, describe, expect, it } from 'vitest'
import { clearRuntimeEvents, getRecentRuntimeEvents } from './runtimeEventBus'
import {
  publishAgentFileWrite,
  publishQueueProgress,
  publishSpecQueueIntent,
} from './runtimeActivityPublishers'

describe('runtimeActivityPublishers', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('publishes queue and agent events', () => {
    publishQueueProgress('2/5 items')
    publishAgentFileWrite('src/app.ts')
    publishSpecQueueIntent('.aide/specs/demo/tasks.md', 'Implement login')

    const events = getRecentRuntimeEvents()
    expect(events.some((event) => event.type === 'queue.progress')).toBe(true)
    expect(events.some((event) => event.type === 'agent.fileWrite')).toBe(true)
  })
})
