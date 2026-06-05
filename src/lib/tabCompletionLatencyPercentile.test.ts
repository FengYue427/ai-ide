import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearTabCompletionLatencySamples,
  computeLatencyPercentile,
  getTabCompletionLatencySamples,
  isTabCompletionP95UnderTarget,
  pushTabCompletionLatencySample,
  TAB_COMPLETION_P95_TARGET_MS,
} from './tabCompletionLatencyPercentile'

describe('tabCompletionLatencyPercentile', () => {
  beforeEach(() => {
    clearTabCompletionLatencySamples()
  })

  it('computes nearest-rank percentile on sorted samples', () => {
    ;[400, 100, 800, 200, 600].forEach(pushTabCompletionLatencySample)
    const samples = getTabCompletionLatencySamples()
    expect(computeLatencyPercentile(samples, 50)).toBe(400)
    expect(computeLatencyPercentile(samples, 95)).toBe(800)
  })

  it('returns null on empty samples', () => {
    const samples = getTabCompletionLatencySamples()
    expect(computeLatencyPercentile(samples, 95)).toBeNull()
    expect(isTabCompletionP95UnderTarget(null)).toBeNull()
  })

  it('checks p95 target with default threshold', () => {
    expect(isTabCompletionP95UnderTarget(TAB_COMPLETION_P95_TARGET_MS - 1)).toBe(true)
    expect(isTabCompletionP95UnderTarget(TAB_COMPLETION_P95_TARGET_MS)).toBe(false)
  })
})
