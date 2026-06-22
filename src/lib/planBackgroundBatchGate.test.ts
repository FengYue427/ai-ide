import { describe, expect, it } from 'vitest'
import { gatePlanBackgroundBatch } from './planBackgroundBatchGate'

describe('gatePlanBackgroundBatch', () => {
  it('blocks free plan batch enqueue', () => {
    expect(gatePlanBackgroundBatch('free', 3)).toEqual({ ok: false, reason: 'upgrade-required' })
  })

  it('allows pro plan within batch cap', () => {
    expect(gatePlanBackgroundBatch('pro', 3)).toEqual({
      ok: true,
      batchMax: 5,
      effectiveCount: 3,
      truncated: false,
    })
  })

  it('truncates when step count exceeds team batch cap', () => {
    expect(gatePlanBackgroundBatch('enterprise', 25)).toEqual({
      ok: true,
      batchMax: 20,
      effectiveCount: 20,
      truncated: true,
    })
  })

  it('rejects empty step count', () => {
    expect(gatePlanBackgroundBatch('pro', 0)).toEqual({ ok: false, reason: 'empty-steps' })
  })
})
