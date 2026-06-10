import { jsonResponse } from '../../http'
import { getBillingCapabilities } from '../../../billing/billingMode'
import { pricingNoteForPath, resolveBillingPath } from '../../../billing/billingPath'
import { BILLING_PLANS, formatPlanPrice, getPlanDisplayQuote } from '../../../billing/plans'

export async function GET() {
  const capabilities = getBillingCapabilities()
  const billingPath = resolveBillingPath(capabilities)
  const preferCny = capabilities.alipay || capabilities.wechat
  const plans = BILLING_PLANS.map((plan) => {
    const quote = getPlanDisplayQuote(plan, { preferCny })
    return {
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      currency: plan.currency,
      priceCny: plan.priceCny,
      priceLabel: formatPlanPrice(plan),
      priceLabelCny: preferCny && plan.priceCny ? `¥${plan.priceCny}` : undefined,
      displayPrice: quote.formatted,
      displayCurrency: quote.currency,
      limits: plan.limits,
    }
  })

  const cnReady = capabilities.alipay || capabilities.wechat

  return jsonResponse({
    ...capabilities,
    cnReady: capabilities.publicWelfare ? false : cnReady,
    billingPath,
    pricingNote: pricingNoteForPath(billingPath, capabilities),
    plans,
  })
}
