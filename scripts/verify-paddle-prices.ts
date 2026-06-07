/**
 * Verify Paddle Price IDs exist (optional — requires PADDLE_API_KEY).
 *
 * Usage: npm run verify:paddle:prices
 */
import { BILLING_PLANS, getPaddlePriceId } from '../lib/billing/plans'
import { resolvePaddleApiBase } from '../lib/billing/paddle'

const key = process.env.PADDLE_API_KEY?.trim()
if (!key) {
  console.log('ℹ️  PADDLE_API_KEY not set — skip Paddle price verify')
  process.exit(0)
}

const billable = BILLING_PLANS.filter((p) => p.name !== 'free')
let failed = 0

console.log('=== Paddle price verify ===\n')
console.log(`API base: ${resolvePaddleApiBase()}\n`)

for (const plan of billable) {
  const priceId = getPaddlePriceId(plan.name)
  if (!priceId) {
    console.error(`❌ ${plan.name}: missing PADDLE_PRICE_${plan.name.toUpperCase()}`)
    failed++
    continue
  }

  const response = await fetch(`${resolvePaddleApiBase()}/prices/${priceId}`, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    console.error(`❌ ${plan.name}: HTTP ${response.status} for ${priceId}`)
    failed++
    continue
  }

  const json = (await response.json()) as { data?: { unit_price?: { amount?: string; currency_code?: string } } }
  const amount = json.data?.unit_price?.amount
  const currency = json.data?.unit_price?.currency_code
  console.log(`✅ ${plan.name}: ${priceId} → ${amount} ${currency} (catalog USD ${plan.price})`)
}

if (failed > 0) process.exit(1)
console.log('\n✅ Paddle price verify passed')
