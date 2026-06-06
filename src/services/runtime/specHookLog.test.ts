import { afterEach, describe, expect, it } from 'vitest'
import { clearRuntimeEvents, getRecentRuntimeEvents } from './runtimeEventBus'
import { getRecentHookEventsForSpec } from './specHookLog'
import { publishHookEnd, publishVerifyFail } from './runtimeActivityPublishers'

describe('specHookLog', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('filters hook events by spec name', () => {
    publishHookEnd('pre-run-tests', true, 'auth-refactor')
    publishVerifyFail('auth-refactor', 'acceptance shell failed')

    const events = getRecentHookEventsForSpec('auth-refactor', getRecentRuntimeEvents())
    expect(events).toHaveLength(2)
  })
})
