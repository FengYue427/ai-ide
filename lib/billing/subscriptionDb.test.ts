import { describe, expect, it } from 'vitest'
import { computeSubscriptionPeriod } from './subscriptionDb'

describe('computeSubscriptionPeriod', () => {
  it('starts a fresh 30-day window for new subscribers', () => {
    const now = new Date('2026-06-07T12:00:00Z')
    const period = computeSubscriptionPeriod(null, 30, now)
    expect(period.currentPeriodStart).toEqual(now)
    expect(period.currentPeriodEnd.toISOString()).toBe('2026-07-07T12:00:00.000Z')
  })

  it('extends from current period end when still active', () => {
    const now = new Date('2026-06-07T12:00:00Z')
    const existing = {
      plan: { name: 'enterprise' },
      currentPeriodStart: new Date('2026-05-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-06-20T00:00:00Z'),
    }
    const period = computeSubscriptionPeriod(existing, 30, now)
    expect(period.currentPeriodEnd.toISOString()).toBe('2026-07-20T00:00:00.000Z')
  })
})
