import { describe, expect, it, beforeEach } from 'vitest'
import {
  classifyTabCompletionFailure,
  getTabCompletionMetrics,
  recordTabCompletionCacheHit,
  recordTabCompletionFailure,
  recordTabCompletionFimAttempt,
  recordTabCompletionFimFallbackToChat,
  recordTabCompletionRequestStart,
  recordTabCompletionSkipped,
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

  it('tracks skipped and failure reasons', () => {
    recordTabCompletionSkipped()
    recordTabCompletionFailure('http413')
    const m = getTabCompletionMetrics()
    expect(m.skipped).toBe(1)
    expect(m.failures).toBe(1)
    expect(m.lastFailureReason).toBe('http413')
  })

  it('classifies common errors', () => {
    expect(classifyTabCompletionFailure(new Error('HTTP 413 Payload Too Large'))).toBe('http413')
    expect(classifyTabCompletionFailure(new Error('request timeout'))).toBe('timeout')
  })

  it('tracks FIM attempts and chat fallback', () => {
    recordTabCompletionFimAttempt()
    recordTabCompletionFimAttempt()
    recordTabCompletionFimFallbackToChat()
    const m = getTabCompletionMetrics()
    expect(m.fimAttempts).toBe(2)
    expect(m.fimFallbackToChat).toBe(1)
  })
})
