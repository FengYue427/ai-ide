import type { Language } from '../i18n'
import {
  buildSpecStudioHooksYaml,
  buildSpecStudioTemplateFiles,
  SPEC_STUDIO_TEMPLATES,
  type SpecStudioTemplateId,
} from '../data/specStudioTemplates'
import type { SpecTemplateFile } from './specsService'

export { detectRecommendedSpecTemplate } from '../lib/specStudioDetect'

export type { SpecStudioTemplateId, SpecStudioStack } from '../data/specStudioTemplates'

export function listSpecStudioTemplates() {
  return SPEC_STUDIO_TEMPLATES
}

export function getSpecStudioTemplate(id: SpecStudioTemplateId) {
  return SPEC_STUDIO_TEMPLATES.find((item) => item.id === id) ?? SPEC_STUDIO_TEMPLATES[0]
}

export interface SpecStudioCreateResult {
  files: SpecTemplateFile[]
  hooksYaml: string | null
  tasksPath: string
  specSlug: string
}

export function createSpecStudioBundle(
  templateId: SpecStudioTemplateId,
  specName: string,
  locale: Language = 'zh-CN',
): SpecStudioCreateResult {
  const files = buildSpecStudioTemplateFiles(templateId, specName, locale)
  const hooksYaml = buildSpecStudioHooksYaml(templateId, specName, locale)
  const tasksPath = files.find((file) => file.path.endsWith('/tasks.md'))?.path ?? ''
  const specSlug =
    tasksPath.replace(/^\.aide\/specs\//, '').replace(/\/tasks\.md$/, '') || 'new-spec'

  const bundle = [...files]
  if (hooksYaml) {
    const hooksPath = tasksPath.replace(/tasks\.md$/, 'hooks.yaml')
    bundle.push({ path: hooksPath, content: hooksYaml })
  }

  return { files: bundle, hooksYaml, tasksPath, specSlug }
}

/** Prompt queued into Chat/Agent to refine a freshly created Spec. */
export function buildSpecStudioRefinePrompt(
  templateId: SpecStudioTemplateId,
  specSlug: string,
  userGoal: string,
  locale: Language = 'zh-CN',
): string {
  const template = getSpecStudioTemplate(templateId)
  const goal = userGoal.trim() || (locale === 'en-US' ? '(fill in your goal)' : '（请补充目标）')

  if (locale === 'en-US') {
    return `[Spec Studio · ${template.id}]
You are helping refine an executable Spec under .aide/specs/${specSlug}/.

User goal: ${goal}

Tasks:
1. Read requirements.md, design.md, tasks.md, acceptance.md (and hooks.yaml if present).
2. Fill gaps for stack "${template.stack}" — concrete files, commands, test names.
3. Keep tasks as checkboxes; align acceptance with measurable criteria.
4. Do NOT implement code yet — only improve the Spec documents unless user asks to execute.`
  }

  return `[Spec Studio · ${template.id}]
你正在帮助完善可执行的 Spec（路径 .aide/specs/${specSlug}/）。

用户目标：${goal}

请完成：
1. 阅读 requirements / design / tasks / acceptance（及 hooks.yaml 如有）。
2. 按「${template.stack}」技术栈补充具体文件路径、命令、测试名。
3. tasks 保持 checkbox；acceptance 要可验证。
4. 先只改 Spec 文档，不要直接改业务代码（除非用户要求执行）。`
}

/** Prompt to execute the first open task in Agent mode. */
export function buildSpecStudioExecutePrompt(tasksPath: string, locale: Language = 'zh-CN'): string {
  if (locale === 'en-US') {
    return `[Spec Studio execute]
Open ${tasksPath} and run the first unchecked task using Agent mode.
Follow hooks.yaml if present. Update acceptance.md when done.`
  }
  return `[Spec Studio 执行]
打开 ${tasksPath}，用 Agent 模式完成第一条未勾选任务。
若存在 hooks.yaml 请遵守；完成后更新 acceptance.md。`
}
