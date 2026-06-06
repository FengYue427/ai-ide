import Stripe from 'stripe'
import { findPlanByName, getStripePriceId } from './plans'

export type StripePriceVerifyResult =
  | { ok: true }
  | { ok: false; errors: string[] }

const BILLABLE_PLANS = ['pro', 'enterprise'] as const

export function expectedStripeUnitAmountCents(planName: string): number | null {
  const plan = findPlanByName(planName)
  if (!plan || plan.price <= 0) return null
  return Math.round(plan.price * 100)
}

export async function verifyStripePricesMatchPlans(stripe: Stripe): Promise<StripePriceVerifyResult> {
  const errors: string[] = []

  for (const planName of BILLABLE_PLANS) {
    const envKey = `STRIPE_PRICE_${planName.toUpperCase()}`
    const priceId = getStripePriceId(planName)
    if (!priceId?.trim()) {
      errors.push(`${envKey} is not set`)
      continue
    }

    const expected = expectedStripeUnitAmountCents(planName)
    if (expected == null) {
      errors.push(`${planName}: no USD price in plans.ts`)
      continue
    }

    const price = await stripe.prices.retrieve(priceId)
    if (price.currency !== 'usd') {
      errors.push(`${envKey}: Stripe currency is ${price.currency}, expected usd`)
    }
    if (price.unit_amount !== expected) {
      errors.push(
        `${envKey}: Stripe unit_amount ${price.unit_amount ?? 'null'} != plans.ts ${expected} (${(expected / 100).toFixed(2)} USD)`,
      )
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true }
}
