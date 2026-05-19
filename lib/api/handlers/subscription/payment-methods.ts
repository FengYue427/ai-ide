import { jsonResponse } from '../../http'
import { getBillingCapabilities } from '../../../billing/billingMode'
import { BILLING_PLANS, formatPlanPrice } from '../../../billing/plans'

export async function GET() {
  const capabilities = getBillingCapabilities()
  const plans = BILLING_PLANS.map((plan) => ({
    name: plan.name,
    displayName: plan.displayName,
    price: plan.price,
    currency: plan.currency,
    priceLabel: formatPlanPrice(plan),
    limits: plan.limits,
  }))

  const cnReady = capabilities.alipay || capabilities.wechat

  return jsonResponse({
    ...capabilities,
    cnReady,
    pricingNote: cnReady
      ? '支持支付宝、微信支付；专业版 ¥19/月，团队版 ¥49/月'
      : capabilities.devMock
        ? '开发模式：可一键模拟升级（未配置商户时）'
        : '支付渠道未配置',
    plans,
  })
}
