import { describe, expect, it } from 'vitest'
import { hasOverseasMoRCheckout, isOverseasCheckoutDeferred } from './overseasCheckout'

describe('overseasCheckout', () => {
  it('detects MoR channels', () => {
    expect(hasOverseasMoRCheckout({ paddle: true })).toBe(true)
    expect(hasOverseasMoRCheckout({ stripe: true })).toBe(true)
    expect(hasOverseasMoRCheckout({ alipay: true })).toBe(false)
  })

  it('defers overseas when only CN channels exist', () => {
    expect(
      isOverseasCheckoutDeferred({ alipay: true, wechat: false, paddle: false, stripe: false }, false),
    ).toBe(true)
  })

  it('does not defer for CN locale checkout path', () => {
    expect(isOverseasCheckoutDeferred({ alipay: true }, true)).toBe(false)
  })

  it('does not defer when paddle is configured', () => {
    expect(isOverseasCheckoutDeferred({ paddle: true }, false)).toBe(false)
  })
})
