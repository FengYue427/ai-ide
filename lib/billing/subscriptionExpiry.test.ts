import { describe, expect, it } from 'vitest'
import { periodEndWithGrace, shouldExpireSubscription, SUBSCRIPTION_GRACE_DAYS } from './subscriptionExpiry'

describe('subscriptionExpiry', () => {
  const proRecord = {
    plan: { name: 'pro' },
    currentPeriodEnd: new Date('2026-05-01T00:00:00Z'),
    status: 'active',
  }

  it('periodEndWithGrace adds grace days', () => {
    const end = new Date('2026-05-10T00:00:00Z')
    const withGrace = periodEndWithGrace(end, 3)
    expect(withGrace.getTime()).toBe(end.getTime() + 3 * 24 * 60 * 60 * 1000)
  })

  it('does not expire before grace ends', () => {
    const now = new Date('2026-05-03T12:00:00Z')
    expect(shouldExpireSubscription(proRecord, now)).toBe(false)
  })

  it('expires after grace ends', () => {
    const now = new Date('2026-05-05T00:00:00Z')
    expect(shouldExpireSubscription(proRecord, now)).toBe(true)
  })

  it('SUBSCRIPTION_GRACE_DAYS is 3', () => {
    expect(SUBSCRIPTION_GRACE_DAYS).toBe(3)
  })
})
