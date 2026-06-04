import { describe, expect, it } from 'vitest'
import { getPayloadBudgetLevel, PAYLOAD_BUDGET_WARN_RATIO } from './payloadBudget'

describe('payloadBudget', () => {
  it('classifies ok, warn, and over', () => {
    const budget = 100_000
    expect(getPayloadBudgetLevel(50_000, budget)).toBe('ok')
    expect(getPayloadBudgetLevel(Math.floor(budget * PAYLOAD_BUDGET_WARN_RATIO), budget)).toBe('warn')
    expect(getPayloadBudgetLevel(budget + 1, budget)).toBe('over')
  })
})
