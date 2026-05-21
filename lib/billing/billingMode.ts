import { isAlipayConfigured, isCnPaymentConfigured, isWechatPayConfigured } from './cnPayment'
import { isStripeConfigured } from './stripe'

/** Dev mock upgrade when no real payment provider is configured. */
export function isDevBillingAllowed(): boolean {
  if (isCnPaymentConfigured() || isStripeConfigured()) return false
  if (process.env.ALLOW_DEV_BILLING === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

/** Simulate CN payment notify in dev/test (never production). */
export function isDevPaymentSimulateAllowed(): boolean {
  if (process.env.VERCEL_ENV === 'production') return false
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.ALLOW_DEV_BILLING === 'true') return true
  const nodeEnv = process.env.NODE_ENV
  if (!nodeEnv || nodeEnv === 'development' || nodeEnv === 'test') return true
  return false
}

export type BillingCapabilities = {
  alipay: boolean
  wechat: boolean
  stripe: boolean
  devMock: boolean
  devSimulate: boolean
}

export function getBillingCapabilities(): BillingCapabilities {
  return {
    alipay: isAlipayConfigured(),
    wechat: isWechatPayConfigured(),
    stripe: isStripeConfigured(),
    devMock: isDevBillingAllowed(),
    devSimulate: isDevPaymentSimulateAllowed(),
  }
}
