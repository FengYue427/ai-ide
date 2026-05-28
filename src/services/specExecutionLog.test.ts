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

  it('includes meta fields when provided', () => {
    const out = buildSpecExecutionLog(
      'Do thing',
      'Result ok',
      new Date('2026-05-28T00:00:00Z'),
      { runId: 'run-123', provider: 'openai', model: 'gpt-5' },
    )
    expect(out).toContain('Run ID: run-123')
    expect(out).toContain('Provider: openai')
    expect(out).toContain('Model: gpt-5')
  })
})
