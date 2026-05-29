import { describe, expect, it } from 'vitest'
import {
  backgroundJobDailyLimit,
  backgroundJobMaxActive,
  FREE_BACKGROUND_JOBS_MAX_ACTIVE,
  FREE_BACKGROUND_JOBS_PER_DAY,
  PAID_BACKGROUND_JOBS_MAX_ACTIVE,
  PAID_BACKGROUND_JOBS_PER_DAY,
} from './backgroundJobEntitlement'

describe('backgroundJobEntitlement', () => {
  it('gives free tighter limits than paid', () => {
    expect(backgroundJobDailyLimit('free')).toBe(FREE_BACKGROUND_JOBS_PER_DAY)
    expect(backgroundJobDailyLimit('pro')).toBe(PAID_BACKGROUND_JOBS_PER_DAY)
    expect(backgroundJobMaxActive('free')).toBe(FREE_BACKGROUND_JOBS_MAX_ACTIVE)
    expect(backgroundJobMaxActive('enterprise')).toBe(PAID_BACKGROUND_JOBS_MAX_ACTIVE)
  })
})
