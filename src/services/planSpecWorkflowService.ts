import type { Language } from '../i18n'

const PLAN_MODE_ZH = `你当前处于 Plan 模式（只规划，不直接改代码）。

请用 markdown 输出可执行计划，并**必须**包含以下章节（即使某节很短也要写）：
## 目标
## 影响文件
## 执行步骤（3–7 步，使用 - [ ] checklist）
## 风险与回滚
## 验证清单（- [ ] checklist）
## 小结

「小结」用 2–4 句 plain text 说明计划要点与建议的下一步；不要省略。
不要输出思考过程、内部推理或 chain-of-thought，只输出最终计划。
不要输出 ### filename 代码块或完整补丁（除非用户明确要求只要代码）。`

const PLAN_MODE_EN = `You are in Plan mode (planning only — do not ship final code patches).

Output an actionable markdown plan with **all** sections below (keep each section, even if brief):
## Goal
## Affected files
## Execution steps (3–7 items, markdown - [ ] checklist)
## Risks & rollback
## Verification checklist (- [ ] items)
## Summary

"Summary" must be 2–4 plain sentences on the plan and suggested next step. Do not skip it.
Do not output chain-of-thought, internal reasoning, or 思考过程 — only the final plan.
Do not output ### filename code blocks or full patches unless the user explicitly asks for code only.`

const PLAN_EXEC_ZH = `你正在执行 Plan 队列中的**单个步骤**（可以改代码）。

回复必须包含：
## 小结
（2–4 句：完成了什么、结果如何）

## 改动文件
- \`path\`: 一句话说明

## 验证
- [ ] 如何验证（命令或手测步骤）

若无法完成，在「小结」说明阻塞原因与建议。
不要输出思考过程或 chain-of-thought，只输出最终执行结果。`

const PLAN_EXEC_EN = `You are executing **one step** from a Plan queue (code changes allowed).

Your reply must include:
## Summary
(2–4 sentences: what you did and the outcome)

## Files changed
- \`path\`: one-line note

## Verification
- [ ] how to verify (command or manual check)

If blocked, explain why in Summary and suggest next steps.
Do not output chain-of-thought or 思考过程 — only the final execution result.`

const SPEC_EXEC_ZH = `你正在执行 Spec 任务队列中的**单个任务**（可以改代码）。

回复必须包含：
## 小结
（2–4 句：完成了什么、与 acceptance 的关系）

## 改动文件
- \`path\`: 一句话说明

## 验证
- [ ] 如何验证

任务上下文见用户消息中的 Spec 路径与任务描述。
不要输出思考过程或 chain-of-thought，只输出最终执行结果。`

const SPEC_EXEC_EN = `You are executing **one Spec task** from the queue (code changes allowed).

Your reply must include:
## Summary
(2–4 sentences: what you did and how it relates to acceptance)

## Files changed
- \`path\`: one-line note

## Verification
- [ ] how to verify

Spec path and task text are in the user message.
Do not output chain-of-thought or 思考过程 — only the final execution result.`

function isZh(locale: Language): boolean {
  return locale === 'zh-CN'
}

export function buildPlanModeSystemPrompt(basePrompt: string, locale: Language = 'zh-CN'): string {
  const rules = isZh(locale) ? PLAN_MODE_ZH : PLAN_MODE_EN
  return `${basePrompt}\n\n${rules}`
}

export function buildPlanExecutionSystemAddon(locale: Language = 'zh-CN'): string {
  return isZh(locale) ? PLAN_EXEC_ZH : PLAN_EXEC_EN
}

export function buildSpecExecutionSystemAddon(locale: Language = 'zh-CN'): string {
  return isZh(locale) ? SPEC_EXEC_ZH : SPEC_EXEC_EN
}

export function buildPlanExecutionPrompt(step: string, locale: Language = 'zh-CN'): string {
  const heading = isZh(locale) ? '请执行以下计划步骤：' : 'Execute this plan step:'
  const summaryHint = isZh(locale)
    ? '按系统要求输出「小结 / 改动文件 / 验证」。'
    : 'Follow the system format: Summary / Files changed / Verification.'
  return `${heading}\n\n- [ ] ${step.trim()}\n\n${summaryHint}`
}

export function buildSpecExecutionPrompt(
  taskPath: string,
  taskText: string,
  locale: Language = 'zh-CN',
): string {
  const heading = isZh(locale) ? '请执行以下 Spec 任务：' : 'Execute this Spec task:'
  const summaryHint = isZh(locale)
    ? '按系统要求输出「小结 / 改动文件 / 验证」。'
    : 'Follow the system format: Summary / Files changed / Verification.'
  return `${heading}\n\n[${taskPath.trim()}] ${taskText.trim()}\n\n${summaryHint}`
}

/** First line or ## 小结 / ## Summary section for backfill & logs. */
export function extractWorkflowSummary(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const section = trimmed.match(
    /##\s*(?:小结|Summary)\s*\r?\n+([\s\S]*?)(?:\r?\n##|\r?\n---|\r?\n###|$)/i,
  )
  if (section?.[1]?.trim()) {
    const line = section[1].trim().split(/\r?\n/).find((row) => row.trim())?.trim()
    if (line) return line.replace(/^[-*]\s*/, '').slice(0, 240)
  }

  const firstBlock = trimmed.split(/\r?\n\r?\n/)[0]?.replace(/^#+\s*/, '').trim()
  return firstBlock ? firstBlock.slice(0, 240) : ''
}

export function appendWorkflowSystemAddon(
  basePrompt: string,
  kind: 'plan-exec' | 'spec-exec',
  locale: Language = 'zh-CN',
): string {
  const addon =
    kind === 'plan-exec' ? buildPlanExecutionSystemAddon(locale) : buildSpecExecutionSystemAddon(locale)
  return `${basePrompt}\n\n${addon}`
}
