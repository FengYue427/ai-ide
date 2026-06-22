import { describe, expect, it } from 'vitest'
import { buildWeeklyRecap, formatWeeklyRecapMarkdown } from './weeklyRecapService'

const FILES = [
  {
    name: '.aide/specs/demo/tasks.md',
    content: '- [x] Done task\n- [ ] Open task\n',
    language: 'markdown',
  },
  {
    name: '.aide/reports/proof-demo-2026.html',
    content: '<html></html>',
    language: 'html',
  },
  {
    name: '.aide/reports/run-001.md',
    content: '# run',
    language: 'markdown',
  },
]

describe('weeklyRecapService', () => {
  it('aggregates spec and report counts', () => {
    const recap = buildWeeklyRecap(FILES)
    expect(recap.specCount).toBe(1)
    expect(recap.doneTaskCount).toBe(1)
    expect(recap.openTaskCount).toBe(1)
    expect(recap.queueReportCount).toBe(1)
    expect(recap.proofReportCount).toBeGreaterThan(0)
  })

  it('formats markdown export', () => {
    const recap = buildWeeklyRecap(FILES)
    const md = formatWeeklyRecapMarkdown(recap, {
      title: 'Weekly',
      doneTasks: 'Done',
      openTasks: 'Open',
      proofReports: 'Proof',
      specs: 'Specs',
      recentProofs: 'Recent',
      learningPathsCompleted: 'Paths done',
      learningPathsInProgress: 'Paths active',
      empty: 'Empty',
    })
    expect(md).toContain('# Weekly')
    expect(md).toContain('Done: 1')
  })
})
