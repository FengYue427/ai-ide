import { describe, expect, it } from 'vitest'
import { buildAutopilotQuotaSnapshot, getAutopilotDailyLimit } from './autopilotUsage'

describe('autopilotUsage', () => {
  it('free tier allows 3 runs per day', () => {
    expect(getAutopilotDailyLimit('free')).toBe(3)
    const snap = buildAutopilotQuotaSnapshot('free', 2)
    expect(snap.allowed).toBe(true)
    expect(snap.remaining).toBe(1)
  })

  it('pro tier is unlimited', () => {
    expect(getAutopilotDailyLimit('pro')).toBe(-1)
    const snap = buildAutopilotQuotaSnapshot('pro', 99)
    expect(snap.unlimited).toBe(true)
    expect(snap.allowed).toBe(true)
  })

  it('blocks when free daily cap reached', () => {
    const snap = buildAutopilotQuotaSnapshot('free', 3)
    expect(snap.allowed).toBe(false)
    expect(snap.remaining).toBe(0)
  })
})
