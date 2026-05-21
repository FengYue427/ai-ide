import type { BillingCapabilities } from './billingMode'
import { BETA_BILLING_NOTE } from './checkout'

/** Path A: public beta, no live merchants. Path B: CN/Stripe configured. dev: local mock checkout. */
export type BillingPath = 'A' | 'B' | 'dev'

export function resolveBillingPath(capabilities: BillingCapabilities): BillingPath {
  if (capabilities.alipay || capabilities.wechat || capabilities.stripe) return 'B'
  if (capabilities.devMock) return 'dev'
  return 'A'
}

export function pricingNoteForPath(path: BillingPath, capabilities: BillingCapabilities): string {
  if (path === 'B') {
    const parts: string[] = []
    if (capabilities.alipay) parts.push('支付宝')
    if (capabilities.wechat) parts.push('微信')
    if (capabilities.stripe) parts.push('Stripe')
    return `支持${parts.join('、')}；专业版 ¥19/月，团队版 ¥49/月`
  }
  if (path === 'dev') {
    return '开发/集成环境：可一键模拟升级（未配置商户时）'
  }
  return BETA_BILLING_NOTE
}
