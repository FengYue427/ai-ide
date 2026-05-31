import { describe, expect, it } from 'vitest'
import { formatRemoteObjectPreview } from './debugLocals'

describe('formatRemoteObjectPreview', () => {
  it('formats primitives and descriptions', () => {
    expect(formatRemoteObjectPreview({ type: 'number', value: 42 })).toBe('42')
    expect(formatRemoteObjectPreview({ type: 'string', value: 'hi' })).toBe('"hi"')
    expect(formatRemoteObjectPreview({ type: 'object', description: 'Array(3)' })).toBe('Array(3)')
  })
})
