import { afterEach, describe, expect, it } from 'vitest'
import { getBillingCapabilities, isDevBillingAllowed, isDevPaymentSimulateAllowed } from './billingMode'

describe('billingMode', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('allows dev mock when no providers configured in development', () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.ALIPAY_APP_ID
    delete process.env.WECHAT_MCH_ID
    process.env.NODE_ENV = 'development'
    delete process.env.ALLOW_DEV_BILLING
    expect(isDevBillingAllowed()).toBe(true)
  })

  it('disallows dev mock in production without override', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ALLOW_DEV_BILLING
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.ALIPAY_APP_ID
    expect(isDevBillingAllowed()).toBe(false)
  })

  it('reports capabilities object shape', () => {
    const caps = getBillingCapabilities()
    expect(caps).toMatchObject({
      alipay: expect.any(Boolean),
      wechat: expect.any(Boolean),
      stripe: expect.any(Boolean),
      devMock: expect.any(Boolean),
      devSimulate: expect.any(Boolean),
    })
  })

  it('never allows dev simulate in production', () => {
    process.env.NODE_ENV = 'production'
    expect(isDevPaymentSimulateAllowed()).toBe(false)
  })
})
