import { describe, expect, it } from 'vitest'
import { hasCheckoutPayment } from './checkout'

describe('hasCheckoutPayment', () => {
  it('returns false when no methods enabled', () => {
    expect(hasCheckoutPayment({})).toBe(false)
  })

  it('returns true when any channel is enabled', () => {
    expect(hasCheckoutPayment({ alipay: true })).toBe(true)
    expect(hasCheckoutPayment({ devMock: true })).toBe(true)
    expect(hasCheckoutPayment({ stripe: true })).toBe(true)
  })
})
