import { describe, expect, it, afterEach } from 'vitest'
import { effectivePlanName, isPublicWelfareMode, PUBLIC_WELFARE_PLAN } from './publicWelfare'

describe('publicWelfare', () => {
  const prev = process.env.PUBLIC_WELFARE_MODE

  afterEach(() => {
    if (prev === undefined) delete process.env.PUBLIC_WELFARE_MODE
    else process.env.PUBLIC_WELFARE_MODE = prev
  })

  it('is off by default', () => {
    delete process.env.PUBLIC_WELFARE_MODE
    expect(isPublicWelfareMode()).toBe(false)
    expect(effectivePlanName('free')).toBe('free')
  })

  it('maps all users to pro plan when enabled', () => {
    process.env.PUBLIC_WELFARE_MODE = 'true'
    expect(isPublicWelfareMode()).toBe(true)
    expect(effectivePlanName('free')).toBe(PUBLIC_WELFARE_PLAN)
    expect(effectivePlanName('enterprise')).toBe(PUBLIC_WELFARE_PLAN)
  })
})
