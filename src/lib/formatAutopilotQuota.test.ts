import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n'
import { formatAutopilotQuotaLabel } from './formatAutopilotQuota'
import type { AutopilotQuota } from '../services/autopilotUsageService'

describe('formatAutopilotQuotaLabel', () => {
  const t = createTranslator('zh-CN')

  it('formats unlimited quota', () => {
    const quota: AutopilotQuota = {
      allowed: true,
      used: 5,
      limit: -1,
      remaining: Number.POSITIVE_INFINITY,
      unlimited: true,
      source: 'server',
    }
    expect(formatAutopilotQuotaLabel(quota, t)).toBe('Autopilot 不限')
  })

  it('formats remaining runs', () => {
    const quota: AutopilotQuota = {
      allowed: true,
      used: 1,
      limit: 3,
      remaining: 2,
      unlimited: false,
      source: 'local',
    }
    expect(formatAutopilotQuotaLabel(quota, t)).toBe('今日 Autopilot 1/3 次 · 剩余 2')
  })

  it('formats blocked quota', () => {
    const quota: AutopilotQuota = {
      allowed: false,
      used: 3,
      limit: 3,
      remaining: 0,
      unlimited: false,
      source: 'local',
    }
    expect(formatAutopilotQuotaLabel(quota, t)).toBe('今日 Autopilot 已用完 (3/3)')
  })
})
