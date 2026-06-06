import { findPlanByName, getPlanAmountCents, getPlanPriceCny } from './plans'

export type CnPriceVerifyResult = { ok: true } | { ok: false; errors: string[] }

const BILLABLE_PLANS = ['pro', 'enterprise'] as const

/** Alipay `total_amount` string (yuan, 2 decimals) from plans.ts. */
export function formatAlipayTotalAmountYuan(planName: string): string | null {
  const cents = getPlanAmountCents(planName)
  if (cents <= 0) return null
  return (cents / 100).toFixed(2)
}

/** Ensure CNY catalog + fen amounts match v1.5 plans (Pro ¥39 · Team ¥79). */
export function verifyCnPlanPricesMatchCatalog(): CnPriceVerifyResult {
  const errors: string[] = []

  for (const planName of BILLABLE_PLANS) {
    const plan = findPlanByName(planName)
    if (!plan) {
      errors.push(`${planName}: missing from BILLING_PLANS`)
      continue
    }

    const cents = getPlanAmountCents(planName)
    const yuan = getPlanPriceCny(plan)
    const alipayYuan = formatAlipayTotalAmountYuan(planName)

    if (yuan <= 0) {
      errors.push(`${planName}: priceCny must be > 0`)
    }
    if (cents !== yuan * 100) {
      errors.push(`${planName}: getPlanAmountCents ${cents} != priceCny ${yuan} * 100`)
    }
    if (alipayYuan !== yuan.toFixed(2)) {
      errors.push(`${planName}: Alipay total_amount ${alipayYuan} != ¥${yuan}`)
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true }
}

export function isAlipayProductionEnv(): boolean {
  if (process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1') return false
  const gateway = process.env.ALIPAY_GATEWAY?.trim() ?? ''
  if (gateway.includes('sandbox') || gateway.includes('alipaydev')) return false
  return Boolean(process.env.ALIPAY_APP_ID?.trim())
}
