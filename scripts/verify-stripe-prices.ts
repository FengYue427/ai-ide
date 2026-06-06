/**
 * Verify Stripe Dashboard Price IDs match lib/billing/plans.ts (v1.5.5).
 *
 * Usage: npm run verify:stripe:prices
 * Requires STRIPE_SECRET_KEY + STRIPE_PRICE_PRO + STRIPE_PRICE_ENTERPRISE.
 */
import Stripe from 'stripe'
import { verifyStripePricesMatchPlans } from '../lib/billing/stripePriceVerify'

const key = process.env.STRIPE_SECRET_KEY?.trim()
if (!key) {
  console.log('ℹ️  STRIPE_SECRET_KEY not set — skip Stripe price verify')
  process.exit(0)
}

console.log('=== Stripe price verify (plans.ts alignment) ===\n')

try {
  const stripe = new Stripe(key)
  const result = await verifyStripePricesMatchPlans(stripe)
  if (result.ok) {
    console.log('✅ Stripe Price IDs match plans.ts ($9.99 Pro · $19.99 Team)')
    process.exit(0)
  }
  for (const err of result.errors) {
    console.error(`❌ ${err}`)
  }
  process.exit(1)
} catch (error) {
  console.error('❌ Stripe price verify failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
