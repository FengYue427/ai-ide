import { describe, expect, it } from 'vitest'
import { formatAlipayTotalAmountYuan, verifyCnPlanPricesMatchCatalog } from './cnPriceVerify'

describe('cnPriceVerify', () => {
  it('formats Alipay yuan amounts from plans.ts', () => {
    expect(formatAlipayTotalAmountYuan('pro')).toBe('39.00')
    expect(formatAlipayTotalAmountYuan('enterprise')).toBe('79.00')
    expect(formatAlipayTotalAmountYuan('free')).toBeNull()
  })

  it('verifies Pro ¥39 and Team ¥79 catalog', () => {
    const result = verifyCnPlanPricesMatchCatalog()
    expect(result.ok).toBe(true)
  })
})
