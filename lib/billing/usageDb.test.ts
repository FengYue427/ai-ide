import { describe, expect, it } from 'vitest'
import { buildQuotaSnapshot, getAiDailyLimit } from './usageDb'

describe('usageDb', () => {
  it('builds unlimited quota for enterprise', () => {
    const quota = buildQuotaSnapshot('enterprise', 10)
    expect(quota.allowed).toBe(true)
    expect(quota.limit).toBe(-1)
    expect(quota.remaining).toBe(Number.POSITIVE_INFINITY)
  })

  it('blocks when free plan limit reached', () => {
    const quota = buildQuotaSnapshot('free', 200)
    expect(quota.allowed).toBe(false)
    expect(quota.remaining).toBe(0)
  })

  it('allows one more request below free limit', () => {
    const quota = buildQuotaSnapshot('free', 199)
    expect(quota.allowed).toBe(true)
    expect(quota.remaining).toBe(1)
  })

  it('exposes plan limits from billing catalog', () => {
    expect(getAiDailyLimit('free')).toBe(200)
    expect(getAiDailyLimit('pro')).toBe(2000)
    expect(getAiDailyLimit('enterprise')).toBe(-1)
  })
})
