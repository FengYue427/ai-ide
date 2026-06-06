import { describe, expect, it } from 'vitest'
import { expectedStripeUnitAmountCents } from './stripePriceVerify'

describe('stripePriceVerify', () => {
  it('maps plans.ts USD prices to Stripe unit_amount cents', () => {
    expect(expectedStripeUnitAmountCents('pro')).toBe(999)
    expect(expectedStripeUnitAmountCents('enterprise')).toBe(1999)
    expect(expectedStripeUnitAmountCents('free')).toBeNull()
  })
})
