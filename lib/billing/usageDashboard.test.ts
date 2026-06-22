import { describe, expect, it } from 'vitest'
import { buildPlatformUsageDashboard } from './usageDashboard'
import { buildQuotaSnapshot } from './usageDb'

describe('buildPlatformUsageDashboard', () => {
  it('aggregates period platform totals and cost', () => {
    const payload = buildPlatformUsageDashboard({
      quota: buildQuotaSnapshot('free', 12),
      platformToday: 5,
      otherToday: 7,
      periodDays: 7,
      daily: [
        { date: '2026-06-01', platform: 2, other: 1, total: 3 },
        { date: '2026-06-02', platform: 3, other: 0, total: 3 },
      ],
    })

    expect(payload.platformPeriodTotal).toBe(5)
    expect(payload.costEstimatePeriodUsd).toBe(0.01)
    expect(payload.platformToday).toBe(5)
    expect(payload.source).toBe('server')
    expect(payload.quotaNearLimit).toBe(false)
  })

  it('marks quota near limit and includes provider', () => {
    const payload = buildPlatformUsageDashboard({
      quota: { used: 85, limit: 100, remaining: 15, plan: 'test', allowed: true },
      platformToday: 1,
      otherToday: 0,
      periodDays: 7,
      daily: [],
      platformProvider: 'deepseek',
      entitlements: {
        plan: 'free',
        unlocked: [],
        locked: ['collabHost'],
        nearLimits: [],
      },
    })
    expect(payload.quotaNearLimit).toBe(true)
    expect(payload.quotaUsagePercent).toBeGreaterThanOrEqual(80)
    expect(payload.platformProvider).toBe('deepseek')
    expect(payload.entitlements?.locked).toContain('collabHost')
  })
})
