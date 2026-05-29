import { describe, expect, it } from 'vitest'
import {
  BUILTIN_PLAN_TEMPLATES,
  createPlanFromTemplate,
  isUserPlanPath,
  listPlanTemplates,
} from './planTemplateService'

describe('planTemplateService', () => {
  it('lists builtin and workspace templates', () => {
    const files = [
      {
        name: '.aide/plans/_templates/custom.md',
        content: '# Custom Template\n\n- [ ] one\n',
      },
      { name: '.aide/plans/existing.md', content: '# Existing' },
    ]
    const items = listPlanTemplates(files)
    expect(items.length).toBe(BUILTIN_PLAN_TEMPLATES.length + 1)
    expect(items.some((item) => item.id === 'feature-dev')).toBe(true)
    expect(items.some((item) => item.id.startsWith('workspace:'))).toBe(true)
  })

  it('creates plan file from builtin template', () => {
    const result = createPlanFromTemplate<{ name: string; content: string }>(
      [],
      'bugfix',
      '修复登录超时',
      new Date('2026-05-28T10:00:00.000Z'),
    )
    expect(result).not.toBeNull()
    expect(result?.path).toMatch(/^\.aide\/plans\//)
    const created = result?.files.find((file) => file.name === result.path)
    expect(created?.content).toContain('修复登录超时')
    expect(created?.content).toContain('- [ ] 复现问题并记录现象')
    expect(created?.content.match(/- Created At:/g)?.length).toBe(1)
  })

  it('excludes template directory from user plan paths', () => {
    expect(isUserPlanPath('.aide/plans/a.md')).toBe(true)
    expect(isUserPlanPath('.aide/plans/_templates/x.md')).toBe(false)
  })
})
