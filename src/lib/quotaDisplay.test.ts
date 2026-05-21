import { describe, expect, it } from 'vitest'
import { formatQuotaLabel, isUnlimitedQuota, quotaBarPercent } from './quotaDisplay'

describe('quotaDisplay', () => {
  it('formats unlimited quota', () => {
    expect(formatQuotaLabel(3, -1)).toBe('3 / 不限')
    expect(isUnlimitedQuota(-1)).toBe(true)
  })

  it('computes bar percent with cap', () => {
    expect(quotaBarPercent(25, 100)).toBe(25)
    expect(quotaBarPercent(150, 100)).toBe(100)
  })
})
