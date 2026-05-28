import { describe, expect, it } from 'vitest'
import { buildSpecExecutionLog } from './specExecutionLog'

describe('specExecutionLog', () => {
  it('builds formatted execution log', () => {
    const out = buildSpecExecutionLog('Do thing', 'Result ok', new Date('2026-05-28T00:00:00Z'))
    expect(out).toContain('Spec Execution Log (2026-05-28)')
    expect(out).toContain('Task: Do thing')
    expect(out).toContain('Result ok')
  })

  it('returns empty string for empty output', () => {
    expect(buildSpecExecutionLog('Task', '   ')).toBe('')
  })
})
