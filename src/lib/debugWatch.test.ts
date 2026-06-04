import { describe, expect, it } from 'vitest'
import { formatCdpEvaluateValue } from './debugWatchEvaluate'
import {
  MAX_DEBUG_WATCH_EXPRESSIONS,
  normalizeWatchSlots,
  nonEmptyWatchExpressions,
  setDebugWatchSlot,
} from './debugWatch'

describe('debugWatch', () => {
  it('pads to three slots', () => {
    expect(normalizeWatchSlots(['a']).length).toBe(MAX_DEBUG_WATCH_EXPRESSIONS)
  })

  it('updates a slot', () => {
    const next = setDebugWatchSlot(normalizeWatchSlots([]), 1, 'foo.bar')
    expect(next[1]).toBe('foo.bar')
  })

  it('filters empty expressions', () => {
    expect(nonEmptyWatchExpressions(['a', '', '  ', 'b'])).toEqual(['a', 'b'])
  })
})

describe('formatCdpEvaluateValue', () => {
  it('prefers description', () => {
    expect(formatCdpEvaluateValue({ description: '42', type: 'number', value: 42 })).toBe('42')
  })

  it('stringifies object values', () => {
    expect(formatCdpEvaluateValue({ value: { ok: true }, type: 'object' })).toBe('{"ok":true}')
  })
})
