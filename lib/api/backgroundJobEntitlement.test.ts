import { describe, expect, it } from 'vitest'
import { getBackgroundJobLimits } from '../billing/entitlements'
import {
  backgroundJobDailyLimit,
  backgroundJobMaxActive,
} from './backgroundJobEntitlement'

describe('backgroundJobEntitlement', () => {
  it('gives free tighter limits than paid', () => {
    const free = getBackgroundJobLimits('free')
    const pro = getBackgroundJobLimits('pro')
    const team = getBackgroundJobLimits('enterprise')
    expect(backgroundJobDailyLimit('free')).toBe(free.dailyLimit)
    expect(backgroundJobDailyLimit('pro')).toBe(pro.dailyLimit)
    expect(backgroundJobMaxActive('free')).toBe(free.maxActive)
    expect(backgroundJobMaxActive('enterprise')).toBe(team.maxActive)
    expect(pro.dailyLimit).toBeGreaterThan(free.dailyLimit)
  })
})
