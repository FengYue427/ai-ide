import type { Language } from '../i18n'
import { buildPlanPathFromName } from './planTemplateService'
import { parseProjectTasks } from './projectTasksService'
import { upsertPlanSpecLinksFile } from './planSpecLinkService'

interface FileLike {
  name: string
  content: string
  language?: string
}

function isZh(locale: Language): boolean {
  return locale === 'zh-CN' || locale === 'ja-JP'
}

export function buildPlanSkeletonContentForSpec(
  specSlug: string,
  tasksPath: string,
  taskLines: string[],
  locale: Language = 'zh-CN',
): string {
  const linked = isZh(locale)
    ? `- 关联 Spec: \`${tasksPath}\``
    : `- Linked Spec: \`${tasksPath}\``
  const steps =
    taskLines.length > 0
      ? taskLines.map((text) => `- [ ] ${text}`)
      : isZh(locale)
        ? ['- [ ] 与 Spec tasks 对齐', '- [ ] 实现并验证']
        : ['- [ ] Align with Spec tasks', '- [ ] Implement and verify']

  const title = isZh(locale) ? `Plan · ${specSlug}` : `Plan · ${specSlug}`
  const stepsHeading = isZh(locale) ? '## 执行步骤' : '## Steps'

  return `# ${title}\n\n${linked}\n\n${stepsHeading}\n\n${steps.join('\n')}\n`
}

/** Create a Plan skeleton mirrored from Spec tasks and link the first open pair. */
export function createLinkedPlanForSpec<T extends FileLike>(
  files: T[],
  input: { specSlug: string; tasksPath: string; planTitle?: string },
  locale: Language = 'zh-CN',
): { files: T[]; planPath: string; index: number } | null {
  const tasksFile = files.find((file) => file.name === input.tasksPath)
  if (!tasksFile) return null

  const parsedTasks = parseProjectTasks(tasksFile.content)
  const taskTexts = parsedTasks.map((task) => task.text)
  const planTitle = input.planTitle?.trim() || `Spec · ${input.specSlug}`
  const planPath = buildPlanPathFromName(planTitle, files)
  const content = buildPlanSkeletonContentForSpec(input.specSlug, input.tasksPath, taskTexts, locale)
  const planFile = { name: planPath, content, language: 'markdown' } as T
  let nextFiles = [...files, planFile]

  const firstSpecTask = parsedTasks.find((task) => !task.done) ?? parsedTasks[0]
  const planSteps = parseProjectTasks(content)
  const firstPlanStep = planSteps.find((step) => !step.done) ?? planSteps[0]
  if (firstSpecTask && firstPlanStep) {
    nextFiles = upsertPlanSpecLinksFile(nextFiles, [
      {
        planPath,
        planStepText: firstPlanStep.text,
        planStepLine: firstPlanStep.line,
        specTasksPath: input.tasksPath,
        specTaskText: firstSpecTask.text,
      },
    ])
  }

  return { files: nextFiles, planPath, index: nextFiles.length - 1 }
}
