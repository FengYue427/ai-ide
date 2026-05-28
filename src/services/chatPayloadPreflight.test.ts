import { describe, expect, it } from 'vitest'
import { getPayloadWarningData } from './chatPayloadPreflight'

describe('getPayloadWarningData', () => {
  it('returns null when within budget', () => {
    expect(getPayloadWarningData(100, 100, 'text', ['a'])).toBeNull()
    expect(getPayloadWarningData(99, 100, 'text', ['a'])).toBeNull()
  })

  it('returns warning payload when over budget', () => {
    expect(getPayloadWarningData(101, 100, 'hello', ['x'])).toEqual({
      estimatedBytes: 101,
      budgetBytes: 100,
      text: 'hello',
      slimPlan: ['x'],
    })
  })
})
