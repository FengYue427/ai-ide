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
    expect(plan.description).toContain('$9.99')
    expect(plan.features[0]).toBe('2000 weighted quota units / day')
  })
})
