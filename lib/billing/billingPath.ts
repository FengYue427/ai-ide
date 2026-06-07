import type { BillingCapabilities } from './billingMode'
import { BETA_BILLING_NOTE, PUBLIC_WELFARE_BILLING_NOTE } from './checkout'
import { PUBLIC_WELFARE_NOTE_ZH } from './publicWelfare'
import { STRIPE_USD_ENTERPRISE, STRIPE_USD_PRO } from './plans'

/** Path A: beta. Path B: live merchants. dev: mock. welfare: 公益免费. */
export type BillingPath = 'A' | 'B' | 'dev' | 'welfare'

export function resolveBillingPath(capabilities: BillingCapabilities): BillingPath {
  if (capabilities.publicWelfare) return 'welfare'
  if (capabilities.alipay || capabilities.wechat || capabilities.stripe || capabilities.paddle) return 'B'
  if (capabilities.devMock) return 'dev'
  return 'A'
}

function isOverseasOnly(capabilities: BillingCapabilities): boolean {
  return (
    (capabilities.stripe || capabilities.paddle) &&
    !capabilities.alipay &&
    !capabilities.wechat
  )
}

export function pricingNoteForPath(path: BillingPath, capabilities: BillingCapabilities): string {
  if (path === 'welfare') {
    return capabilities.publicWelfare ? PUBLIC_WELFARE_NOTE_ZH : PUBLIC_WELFARE_BILLING_NOTE
  }
  if (path === 'B') {
    const parts: string[] = []
    if (capabilities.alipay) parts.push('支付宝')
    if (capabilities.wechat) parts.push('微信')
    if (capabilities.paddle) parts.push('Paddle')
    if (capabilities.stripe) parts.push('Stripe')
    if (isOverseasOnly(capabilities)) {
      if (capabilities.paddle && !capabilities.stripe) {
        return `Paddle checkout; Pro $${STRIPE_USD_PRO}/mo, Team $${STRIPE_USD_ENTERPRISE}/mo`
      }
      return `Stripe checkout; Pro $${STRIPE_USD_PRO}/mo, Team $${STRIPE_USD_ENTERPRISE}/mo`
    }
    return `支持${parts.join('、')}；专业版 ¥39/月，团队版 ¥79/月（Stripe：$${STRIPE_USD_PRO} / $${STRIPE_USD_ENTERPRISE}）`
  }
  if (path === 'dev') {
    return '开发/集成环境：可一键模拟升级（未配置商户时）'
  }
  return BETA_BILLING_NOTE
}
