import { describe, expect, it } from 'vitest'
import { buildSpecStatusSummary } from './specStatusSummary'

describe('specStatusSummary', () => {
  it('counts specs and open tasks', () => {
    const files = [
      { name: '.aide/specs/a/tasks.md', content: '- [ ] one\n', language: 'markdown' },
      { name: '.aide/specs/b/tasks.md', content: '- [x] done\n', language: 'markdown' },
    ]
    const summary = buildSpecStatusSummary(files)
    expect(summary.specCount).toBe(2)
    expect(summary.openTaskCount).toBe(1)
    expect(summary.runnableTasksPath).toBe('.aide/specs/a/tasks.md')
    expect(summary.activeSpecSlug).toBe('a')
  })
})
