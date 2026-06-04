import { isAlipayConfigured, isCnPaymentConfigured, isWechatPayConfigured } from './cnPayment'
import { isPublicWelfareMode } from './publicWelfare'
import { isStripeConfigured } from './stripe'

/** Dev mock upgrade when no real payment provider is configured. */
export function isDevBillingAllowed(): boolean {
  if (isPublicWelfareMode()) return false
  if (process.env.VERCEL_ENV === 'production') return false
  if (process.env.NODE_ENV === 'production') return false
  if (isCnPaymentConfigured() || isStripeConfigured()) return false
  if (process.env.ALLOW_DEV_BILLING === 'true') return true
  return true
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
  publicWelfare: boolean
}

export function getBillingCapabilities(): BillingCapabilities {
  const welfare = isPublicWelfareMode()
  return {
    alipay: welfare ? false : isAlipayConfigured(),
    wechat: welfare ? false : isWechatPayConfigured(),
    stripe: welfare ? false : isStripeConfigured(),
    devMock: welfare ? false : isDevBillingAllowed(),
    devSimulate: welfare ? false : isDevPaymentSimulateAllowed(),
    publicWelfare: welfare,
  }
}
