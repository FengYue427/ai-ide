import { describe, expect, it } from 'vitest'
import { pricingNoteForPath, resolveBillingPath } from './billingPath'

describe('billingPath', () => {
  it('resolves path B when CN or Stripe configured', () => {
    expect(
      resolveBillingPath({
        alipay: true,
        wechat: false,
        stripe: false,
        devMock: false,
        devSimulate: false,
      }),
    ).toBe('B')
  })

  it('resolves path A for public beta without merchants', () => {
    expect(
      resolveBillingPath({
        alipay: false,
        wechat: false,
        stripe: false,
        devMock: false,
        devSimulate: false,
      }),
    ).toBe('A')
  })

  it('uses beta note for path A', () => {
    const note = pricingNoteForPath('A', {
      alipay: false,
      wechat: false,
      stripe: false,
      devMock: false,
      devSimulate: false,
    })
    expect(note).toContain('公测')
  })
})
