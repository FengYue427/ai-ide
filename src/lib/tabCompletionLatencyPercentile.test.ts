import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearTabCompletionLatencySamples,
  computeLatencyPercentile,
  getTabCompletionLatencySamples,
  getTabCompletionP95TargetMs,
  isTabCompletionP95UnderTarget,
  pushTabCompletionLatencySample,
  TAB_COMPLETION_P95_TARGET_MS,
} from './tabCompletionLatencyPercentile'
import { isTabPlusPlusProductionEnabled } from './v15Features'

vi.mock('./v15Features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./v15Features')>()
  return {
    ...actual,
    isTabPlusPlusProductionEnabled: vi.fn(() => false),
  }
})

describe('tabCompletionLatencyPercentile', () => {
  beforeEach(() => {
    clearTabCompletionLatencySamples()
    vi.mocked(isTabPlusPlusProductionEnabled).mockReturnValue(false)
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
    expect(getTabCompletionP95TargetMs()).toBe(TAB_COMPLETION_P95_TARGET_MS)
    expect(isTabCompletionP95UnderTarget(TAB_COMPLETION_P95_TARGET_MS - 1)).toBe(true)
    expect(isTabCompletionP95UnderTarget(TAB_COMPLETION_P95_TARGET_MS)).toBe(false)
  })

  it('uses 400ms target when Tab++ production is on (v1.5.2)', () => {
    vi.mocked(isTabPlusPlusProductionEnabled).mockReturnValue(true)
    expect(getTabCompletionP95TargetMs()).toBe(400)
    expect(isTabCompletionP95UnderTarget(399)).toBe(true)
    expect(isTabCompletionP95UnderTarget(400)).toBe(false)
  })
})
