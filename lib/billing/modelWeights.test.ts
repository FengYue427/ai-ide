import { describe, expect, it } from 'vitest'
import { getModelTier, getModelWeight, isPlatformModelAllowedForPlan } from './modelWeights'

describe('modelWeights', () => {
  it('assigns economy tier to flash models', () => {
    expect(getModelTier('deepseek', 'deepseek-v4-flash')).toBe('economy')
    expect(getModelWeight('deepseek', 'deepseek-v4-flash')).toBe(1)
  })

  it('assigns frontier tier to reasoning models', () => {
    expect(getModelTier('openai', 'o3-mini')).toBe('frontier')
    expect(getModelWeight('openai', 'o3-mini')).toBe(10)
  })

  it('restricts free plan to economy models', () => {
    expect(isPlatformModelAllowedForPlan('deepseek', 'deepseek-v4-flash', 'free')).toBe(true)
    expect(isPlatformModelAllowedForPlan('openai', 'gpt-4o', 'free')).toBe(false)
    expect(isPlatformModelAllowedForPlan('openai', 'gpt-4o', 'pro')).toBe(true)
  })
})
