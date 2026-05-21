import { jsonResponse } from '../../http'
import { getBillingCapabilities } from '../../../billing/billingMode'
import { pricingNoteForPath, resolveBillingPath } from '../../../billing/billingPath'
import { BILLING_PLANS, formatPlanPrice } from '../../../billing/plans'

export async function GET() {
  const capabilities = getBillingCapabilities()
  const billingPath = resolveBillingPath(capabilities)
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
    billingPath,
    pricingNote: pricingNoteForPath(billingPath, capabilities),
    plans,
  })
}
