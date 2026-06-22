import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n'
import { localizePlan } from './localizePlan'

describe('localizePlan', () => {
  it('maps known plan names to en-US labels', () => {
    const t = createTranslator('en-US')
    const plan = localizePlan(
      {
        name: 'pro',
        displayName: '专业版',
        description: '中文描述',
        features: ['a', 'b', 'c'],
      },
      t,
    )
    expect(plan.displayName).toBe('Pro')
    expect(plan.description).toContain('Autopilot')
    expect(plan.features[0]).toBe('All platform AI tiers + 2000 quota / day')
    expect(plan.features).toHaveLength(6)
  })
})
