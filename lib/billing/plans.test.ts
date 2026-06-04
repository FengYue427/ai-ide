import { describe, expect, it } from 'vitest'
import {
  STRIPE_USD_ENTERPRISE,
  STRIPE_USD_PRO,
  findPlanByName,
  formatPlanPrice,
  getBillablePlanNames,
  getPlanAmountCents,
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
    expect(formatPlanPrice(pro!)).toBe('$4.99')
    expect(getPlanAmountCents('pro')).toBe(1900)
    expect(getPlanAmountCents('enterprise')).toBe(4900)
    expect(findPlanByName('enterprise')?.price).toBe(STRIPE_USD_ENTERPRISE)
    expect(formatPlanPrice(findPlanByName('enterprise')!)).toBe('$12.99')
  })
})
