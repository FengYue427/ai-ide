import { describe, expect, it, beforeEach } from 'vitest'
import {
  getTabCompletionMetrics,
  recordTabCompletionCacheHit,
  recordTabCompletionRequestStart,
  recordTabCompletionSuccess,
  resetTabCompletionMetrics,
} from './inlineCompletionMetrics'

describe('inlineCompletionMetrics', () => {
  beforeEach(() => {
    resetTabCompletionMetrics()
  })

  it('tracks cache hits and success paths', () => {
    recordTabCompletionCacheHit()
    recordTabCompletionRequestStart()
    recordTabCompletionSuccess('fim', 120)
    recordTabCompletionSuccess('platform', 80)

    const m = getTabCompletionMetrics()
    expect(m.cacheHits).toBe(1)
    expect(m.cacheMisses).toBe(1)
    expect(m.fimSuccess).toBe(1)
    expect(m.platformSuccess).toBe(1)
    expect(m.lastPath).toBe('platform')
    expect(m.avgLatencyMs).toBe(100)
  })
})
