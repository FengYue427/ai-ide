import { describe, expect, it } from 'vitest'
import {
  applyPlanArtifacts,
  buildPlanFilePath,
  buildPlanModeSystemPrompt,
  extractChecklistTasks,
} from './planModeService'

describe('planModeService', () => {
  it('extracts checklist tasks from markdown', () => {
    const text = '- [ ] step one\n- [ ] step two\n- [x] done'
    expect(extractChecklistTasks(text)).toEqual(['step one', 'step two'])
  })

  it('builds deterministic plan path with timestamp', () => {
    const path = buildPlanFilePath(new Date('2026-05-28T08:00:00.000Z'))
    expect(path).toBe('.aide/plans/plan-2026-05-28T08-00-00.md')
  })

  it('applies plan artifacts and appends tasks', () => {
    const files = [{ name: 'README.md', content: 'x', language: 'markdown' }]
    const out = applyPlanArtifacts(
      files,
      'req',
      '- [ ] first\n- [ ] second',
      new Date('2026-05-28T08:00:00.000Z'),
    )
    expect(out.some((file) => file.name.startsWith('.aide/plans/plan-'))).toBe(true)
    const tasks = out.find((file) => file.name === '.aide/tasks.md')
    expect(tasks?.content).toContain('- [ ] first')
    expect(tasks?.content).toContain('- [ ] second')
  })

  it('injects plan mode instructions into prompt', () => {
    const out = buildPlanModeSystemPrompt('BASE')
    expect(out).toContain('BASE')
    expect(out).toContain('Plan 模式')
    expect(out).toContain('## 执行步骤')
  })
})
