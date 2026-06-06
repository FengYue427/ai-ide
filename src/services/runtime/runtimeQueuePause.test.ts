import { afterEach, describe, expect, it } from 'vitest'
import {
  clearRuntimeQueuePause,
  formatHookPauseReason,
  getRuntimeQueuePause,
  isRuntimeQueuePaused,
  setRuntimeQueuePaused,
  subscribeRuntimeQueuePause,
} from './runtimeQueuePause'

describe('runtimeQueuePause', () => {
  afterEach(() => {
    clearRuntimeQueuePause()
  })

  it('tracks pause state and notifies subscribers', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeRuntimeQueuePause(() => {
      seen.push(isRuntimeQueuePaused())
    })

    setRuntimeQueuePaused({ reason: 'hook failed', hookId: 'lint-gate' })
    expect(getRuntimeQueuePause()?.hookId).toBe('lint-gate')
    expect(isRuntimeQueuePaused()).toBe(true)

    clearRuntimeQueuePause()
    expect(isRuntimeQueuePaused()).toBe(false)
    expect(seen).toEqual([true, false])

    unsubscribe()
  })

  it('formats hook pause reason', () => {
    expect(formatHookPauseReason('lint-gate', 'exited 1')).toBe('Hook "lint-gate"：exited 1')
  })
})
