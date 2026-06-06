/**
 * Verify CN checkout amounts match lib/billing/plans.ts (v1.5.6).
 *
 * Usage:
 *   npm run verify:alipay:prices
 *   npm run verify:alipay:prices -- --production
 */
import { verifyCnPlanPricesMatchCatalog, isAlipayProductionEnv } from '../lib/billing/cnPriceVerify'

const production = process.argv.includes('--production')

console.log('=== Alipay / CN price verify (plans.ts alignment) ===\n')

const catalog = verifyCnPlanPricesMatchCatalog()
if (catalog.ok) {
  console.log('✅ CN catalog: Pro ¥39.00 · Team ¥79.00 (Alipay total_amount)')
} else {
  for (const err of catalog.errors) console.error(`❌ ${err}`)
}

let failed = catalog.ok ? 0 : 1

if (production) {
  if (process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1') {
    console.error('\n❌ ALIPAY_SANDBOX=true — must be unset/false for production GA')
    failed++
  } else if (isAlipayProductionEnv()) {
    console.log('✅ Alipay production env detected (non-sandbox gateway)')
  } else {
    console.log('ℹ️  Alipay production keys not detected — catalog check only')
  }
} else {
  console.log('\nℹ️  Pass --production to fail on ALIPAY_SANDBOX=true')
}

if (failed > 0) process.exit(1)
console.log('\n✅ Alipay price verify passed')
