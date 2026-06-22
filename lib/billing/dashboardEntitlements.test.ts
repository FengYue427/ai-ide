import { describe, expect, it } from 'vitest'
import { buildDashboardEntitlements, getCollabMaxParticipants } from './dashboardEntitlements'
import { getEffectiveEntitlements } from './entitlements'

describe('dashboardEntitlements', () => {
  it('collab max participants differ by tier', () => {
    expect(getCollabMaxParticipants('free')).toBe(0)
    expect(getCollabMaxParticipants('pro')).toBe(4)
    expect(getCollabMaxParticipants('enterprise')).toBe(10)
  })

  it('marks locked pro features on free plan', () => {
    const payload = buildDashboardEntitlements('free', getEffectiveEntitlements('free'))
    expect(payload.locked).toContain('collabHost')
    expect(payload.unlocked).not.toContain('proofHtmlExport')
  })

  it('flags ai quota near limit', () => {
    const payload = buildDashboardEntitlements('pro', getEffectiveEntitlements('pro'), {
      aiQuota: {
        allowed: true,
        used: 1800,
        limit: 2000,
        remaining: 200,
        plan: 'pro',
      },
    })
    expect(payload.nearLimits.some((item) => item.id === 'aiQuota')).toBe(true)
  })
})
