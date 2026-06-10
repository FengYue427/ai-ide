import { describe, expect, it } from 'vitest'
import {
  STRIPE_USD_ENTERPRISE,
  STRIPE_USD_PRO,
  findPlanByName,
  formatPlanPrice,
  getBillablePlanNames,
  getPlanAmountCents,
  getPlanDisplayQuote,
} from './plans'

describe('billing plans', () => {
  it('lists billable plan names', () => {
    expect(getBillablePlanNames()).toEqual(['pro', 'enterprise'])
  })

  it('finds plan by name', () => {
    expect(findPlanByName('pro')?.displayName).toBe('专业版')
  })

  it('uses USD for Stripe display and CNY fen for CN APIs', () => {
    const pro = findPlanByName('pro')
    expect(pro?.price).toBe(STRIPE_USD_PRO)
    expect(pro?.currency).toBe('USD')
    expect(formatPlanPrice(pro!)).toBe('$9.99')
    expect(getPlanAmountCents('pro')).toBe(3900)
    expect(getPlanAmountCents('enterprise')).toBe(7900)
    expect(findPlanByName('enterprise')?.price).toBe(STRIPE_USD_ENTERPRISE)
    expect(formatPlanPrice(findPlanByName('enterprise')!)).toBe('$19.99')
  })

  it('shows CNY in UI when preferCny even if catalog currency is USD', () => {
    const pro = findPlanByName('pro')!
    expect(getPlanDisplayQuote(pro, { preferCny: true }).formatted).toBe('¥39')
    expect(getPlanDisplayQuote(findPlanByName('enterprise')!, { preferCny: true }).formatted).toBe(
      '¥79',
    )
    expect(formatPlanPrice(pro, { preferCny: true })).toBe('¥39')
  })

  it('merges priceCny from catalog for API plan rows without priceCny', () => {
    const quote = getPlanDisplayQuote(
      { name: 'pro', price: 9.99, currency: 'USD' },
      { preferCny: true },
    )
    expect(quote.amount).toBe(39)
    expect(quote.symbol).toBe('¥')
  })
})
