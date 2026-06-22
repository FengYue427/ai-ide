import { describe, expect, it } from 'vitest'
import {
  assertEntitlementFeature,
  getBackgroundJobLimits,
  getEffectiveEntitlements,
  getEntitlements,
  getMaxSharesForPlan,
  getPlanLimitsFromEntitlements,
  getShareTtlMs,
  isEntitlementEnabled,
} from './entitlements'

describe('getEntitlements', () => {
  it('free tier caps cloud and agent usage', () => {
    const e = getEntitlements('free')
    expect(e.workspaces).toBe(3)
    expect(e.maxShares).toBe(5)
    expect(e.shareTtlDays).toBe(7)
    expect(e.backgroundJobsPerDay).toBe(2)
    expect(e.autopilotRunsPerDay).toBe(3)
    expect(e.features.proofHtmlExport).toBe(false)
  })

  it('pro unlocks linkage features', () => {
    const e = getEntitlements('pro')
    expect(e.features.autopilotUnlimited).toBe(true)
    expect(e.features.intentShareImport).toBe(true)
    expect(e.backgroundJobsBatchMax).toBe(5)
    expect(e.collabMaxParticipants).toBe(4)
  })

  it('enterprise raises team limits', () => {
    const e = getEntitlements('enterprise')
    expect(e.aiRequestsPerDay).toBe(-1)
    expect(e.maxShares).toBe(100)
    expect(e.shareTtlDays).toBe(365)
    expect(e.backgroundJobsBatchMax).toBe(20)
    expect(e.collabMaxParticipants).toBe(10)
    expect(e.features.shareProgressWatch).toBe(true)
  })

  it('share progress watch is team-only', () => {
    expect(isEntitlementEnabled('free', 'shareProgressWatch')).toBe(false)
    expect(isEntitlementEnabled('pro', 'shareProgressWatch')).toBe(false)
    expect(isEntitlementEnabled('enterprise', 'shareProgressWatch')).toBe(true)
    expect(assertEntitlementFeature('pro', 'shareProgressWatch')).toEqual({
      ok: false,
      requiredPlan: 'enterprise',
      feature: 'shareProgressWatch',
    })
  })
})

describe('plan helpers', () => {
  it('maps share TTL from plan', () => {
    expect(getShareTtlMs('free')).toBe(7 * 24 * 60 * 60 * 1000)
    expect(getShareTtlMs('pro')).toBe(90 * 24 * 60 * 60 * 1000)
  })

  it('maps max shares from plan', () => {
    expect(getMaxSharesForPlan('free')).toBe(5)
    expect(getMaxSharesForPlan('pro')).toBe(30)
  })

  it('background job limits differ by tier', () => {
    expect(getBackgroundJobLimits('free')).toEqual({ dailyLimit: 2, maxActive: 1, batchMax: 0 })
    expect(getBackgroundJobLimits('enterprise').dailyLimit).toBe(300)
  })

  it('assertEntitlementFeature blocks free from pro features', () => {
    expect(assertEntitlementFeature('free', 'proofHtmlExport')).toEqual({
      ok: false,
      requiredPlan: 'pro',
      feature: 'proofHtmlExport',
    })
    expect(assertEntitlementFeature('pro', 'proofHtmlExport')).toEqual({ ok: true })
  })

  it('isEntitlementEnabled respects feature flags', () => {
    expect(isEntitlementEnabled('free', 'collabHost')).toBe(false)
    expect(isEntitlementEnabled('pro', 'collabHost')).toBe(true)
  })

  it('getPlanLimitsFromEntitlements matches matrix', () => {
    expect(getPlanLimitsFromEntitlements('free').workspaces).toBe(3)
    expect(getPlanLimitsFromEntitlements('pro').aiRequestsPerDay).toBe(2000)
  })

  it('unknown plan falls back to free', () => {
    expect(getEntitlements('unknown').planName).toBe('free')
    expect(getEffectiveEntitlements('unknown').planName).toBe('free')
  })
})
