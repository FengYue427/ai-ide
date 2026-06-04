import { describe, expect, it } from 'vitest'
import { isQuotaNearLimit, quotaUsagePercent } from './quotaUsageHints'

describe('quotaUsageHints', () => {
  it('flags near limit at 80%', () => {
    expect(isQuotaNearLimit(80, 100)).toBe(true)
    expect(isQuotaNearLimit(79, 100)).toBe(false)
  })

  it('computes usage percent', () => {
    expect(quotaUsagePercent(50, 100)).toBe(50)
    expect(quotaUsagePercent(150, 100)).toBe(100)
  })
})
