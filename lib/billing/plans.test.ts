import { describe, expect, it } from 'vitest'
import { findPlanByName, getBillablePlanNames, getPlanAmountCents } from './plans'

describe('billing plans', () => {
  it('lists billable plan names', () => {
    expect(getBillablePlanNames()).toEqual(['pro', 'enterprise'])
  })

  it('finds plan by name', () => {
    expect(findPlanByName('pro')?.displayName).toBe('专业版')
  })

  it('returns CNY amount in fen', () => {
    expect(getPlanAmountCents('pro')).toBe(1900)
    expect(getPlanAmountCents('enterprise')).toBe(4900)
    expect(findPlanByName('pro')?.currency).toBe('CNY')
  })
})
