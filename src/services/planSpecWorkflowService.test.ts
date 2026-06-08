import { describe, expect, it } from 'vitest'
import {
  appendWorkflowSystemAddon,
  buildPlanExecutionPrompt,
  buildPlanModeSystemPrompt,
  buildSpecExecutionPrompt,
  extractWorkflowSummary,
} from './planSpecWorkflowService'

describe('planSpecWorkflowService', () => {
  it('builds bilingual plan mode prompts', () => {
    expect(buildPlanModeSystemPrompt('BASE', 'zh-CN')).toContain('## 小结')
    expect(buildPlanModeSystemPrompt('BASE', 'en-US')).toContain('## Summary')
  })

  it('builds structured plan and spec execution prompts', () => {
    expect(buildPlanExecutionPrompt('refactor chat', 'zh-CN')).toContain('- [ ] refactor chat')
    expect(buildSpecExecutionPrompt('.aide/specs/x/tasks.md', 'Add tests', 'en-US')).toContain(
      'Summary',
    )
  })

  it('extracts summary section for logs', () => {
    const text = '## 小结\n\n完成了 chat 重构。\n\n## 改动文件\n- `a.ts`'
    expect(extractWorkflowSummary(text)).toBe('完成了 chat 重构。')
  })

  it('appends queue execution addons', () => {
    const out = appendWorkflowSystemAddon('CTX', 'spec-exec', 'zh-CN')
    expect(out).toContain('CTX')
    expect(out).toContain('Spec 任务')
  })
})
