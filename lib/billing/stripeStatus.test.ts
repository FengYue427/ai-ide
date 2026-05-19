import { describe, expect, it } from 'vitest'
import { mapStripeSubscriptionStatus } from './stripeStatus'

describe('mapStripeSubscriptionStatus', () => {
  it('maps active Stripe states to active', () => {
    expect(mapStripeSubscriptionStatus('active')).toBe('active')
    expect(mapStripeSubscriptionStatus('trialing')).toBe('active')
  })

  it('maps billing problem states', () => {
    expect(mapStripeSubscriptionStatus('past_due')).toBe('past_due')
    expect(mapStripeSubscriptionStatus('unpaid')).toBe('unpaid')
  })

  it('maps terminal states to canceled', () => {
    expect(mapStripeSubscriptionStatus('canceled')).toBe('canceled')
    expect(mapStripeSubscriptionStatus('incomplete_expired')).toBe('canceled')
  })

  it('passes through unknown statuses', () => {
    expect(mapStripeSubscriptionStatus('incomplete')).toBe('incomplete')
  })
})
