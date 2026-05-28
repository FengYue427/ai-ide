import { describe, expect, it } from 'vitest'
import { appendPlanExecutionBackfill, buildPlanExecutionBackfillMarkdown } from './planBackfillService'

describe('planBackfillService', () => {
  it('builds markdown with runId when present', () => {
    const md = buildPlanExecutionBackfillMarkdown({
      planPath: '.aide/plans/p.md',
      stepText: 'Do x',
      runId: 'run-1',
      assistantOutput: 'OK',
      now: new Date('2026-05-28T00:00:00.000Z'),
    })
    expect(md).toContain('Plan Step Execution (2026-05-28T00:00:00.000Z)')
    expect(md).toContain('Step: Do x')
    expect(md).toContain('Run ID: run-1')
    expect(md).toContain('OK')
  })

  it('appends to matching plan file', () => {
    const files = [
      { name: '.aide/plans/p.md', content: 'PLAN' },
      { name: 'x.md', content: 'X' },
    ]
    const next = appendPlanExecutionBackfill(files, {
      planPath: '.aide/plans/p.md',
      stepText: 'Do x',
      assistantOutput: 'OK',
      now: new Date('2026-05-28T00:00:00.000Z'),
    })
    expect(next[0].content).toContain('PLAN')
    expect(next[0].content).toContain('Step: Do x')
    expect(next[1].content).toBe('X')
  })
})
