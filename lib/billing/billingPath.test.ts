import { describe, expect, it } from 'vitest'
import { pricingNoteForPath, resolveBillingPath } from './billingPath'

const baseCaps = {
  alipay: false,
  wechat: false,
  stripe: false,
  paddle: false,
  devMock: false,
  devSimulate: false,
  publicWelfare: false,
}

describe('billingPath', () => {
  it('resolves path B when CN or Stripe configured', () => {
    expect(resolveBillingPath({ ...baseCaps, alipay: true })).toBe('B')
  })

  it('resolves path B when Paddle configured', () => {
    expect(resolveBillingPath({ ...baseCaps, paddle: true })).toBe('B')
  })

  it('resolves path welfare when public welfare mode', () => {
    expect(resolveBillingPath({ ...baseCaps, publicWelfare: true })).toBe('welfare')
  })

  it('resolves path A for public beta without merchants', () => {
    expect(resolveBillingPath(baseCaps)).toBe('A')
  })

  it('uses beta note for path A', () => {
    const note = pricingNoteForPath('A', baseCaps)
    expect(note).toContain('公测')
  })
})
