import { describe, expect, it } from 'vitest'
import { preferCnBillingCheckout } from './billingRegion'

describe('preferCnBillingCheckout', () => {
  it('returns true for zh-CN', () => {
    expect(preferCnBillingCheckout('zh-CN')).toBe(true)
  })

  it('returns false for en-US', () => {
    expect(preferCnBillingCheckout('en-US')).toBe(false)
  })

  it('returns false for zh-TW', () => {
    expect(preferCnBillingCheckout('zh-TW')).toBe(false)
  })
})
