import { describe, expect, it } from 'vitest'
import {
  applyBundleDocEdits,
  assembleFormalizationBundle,
  buildFormalizationPreviewFiles,
  injectUserGoalIntoRequirements,
  summarizeFormalizationPreview,
} from './intentFormalizationService'

describe('intentFormalizationService', () => {
  it('injects user goal into requirements Goals section', () => {
    const base = '# Requirements\n\n## Goals\n\n- Existing goal\n'
    const next = injectUserGoalIntoRequirements(base, 'Add refresh token API', 'zh-CN')
    expect(next).toContain('- Add refresh token API')
    expect(next).toContain('- Existing goal')
  })

  it('builds preview files with goal applied', () => {
    const files = buildFormalizationPreviewFiles('blank', 'my-spec', 'Ship MVP auth', 'en-US')
    const requirements = files.find((file) => file.path.endsWith('/requirements.md'))
    expect(requirements?.content).toContain('Ship MVP auth')
    expect(files.some((file) => file.path.endsWith('/tasks.md'))).toBe(true)
  })

  it('summarizes open tasks and acceptance items', () => {
    const files = buildFormalizationPreviewFiles('blank', 'summary-spec', '', 'zh-CN')
    const summary = summarizeFormalizationPreview(files, 'blank', 'summary-spec')
    expect(summary.fileCount).toBeGreaterThanOrEqual(4)
    expect(summary.openTasks).toBeGreaterThan(0)
    expect(summary.acceptanceItems).toBeGreaterThan(0)
  })

  it('applies inline doc edits before assemble', () => {
    const bundle = assembleFormalizationBundle('blank', 'edited-spec', 'Goal', 'zh-CN', {
      tasks: '# Tasks\n\n- [ ] Custom task only\n',
    })
    const tasks = bundle.files.find((file) => file.path.endsWith('/tasks.md'))
    expect(tasks?.content).toContain('Custom task only')
    expect(bundle.tasksPath).toContain('edited-spec')
  })

  it('applyBundleDocEdits leaves unrelated files untouched', () => {
    const files = buildFormalizationPreviewFiles('blank', 'x', '', 'zh-CN')
    const next = applyBundleDocEdits(files, { design: '# Design\n\n- Custom\n' })
    expect(next.find((f) => f.path.endsWith('/design.md'))?.content).toContain('Custom')
    expect(next.find((f) => f.path.endsWith('/tasks.md'))?.content).toEqual(
      files.find((f) => f.path.endsWith('/tasks.md'))?.content,
    )
  })
})
