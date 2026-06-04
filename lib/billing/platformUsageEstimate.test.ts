import { afterEach, describe, expect, it } from 'vitest'
import { estimatePlatformCostUsd, getPlatformCostPerRequestUsd } from './platformUsageEstimate'

describe('platformUsageEstimate', () => {
  afterEach(() => {
    delete process.env.PLATFORM_AI_ESTIMATE_USD_PER_REQUEST
  })

  it('uses default rate when env unset', () => {
    expect(getPlatformCostPerRequestUsd()).toBe(0.002)
    expect(estimatePlatformCostUsd(10)).toBe(0.02)
  })

  it('respects env override', () => {
    process.env.PLATFORM_AI_ESTIMATE_USD_PER_REQUEST = '0.01'
    expect(getPlatformCostPerRequestUsd()).toBe(0.01)
    expect(estimatePlatformCostUsd(3)).toBe(0.03)
  })
})
