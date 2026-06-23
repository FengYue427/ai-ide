import type { Language } from '../../i18n'
import { injectUserGoalIntoRequirements } from './intentFormalizationService'
import { createSpecStudioBundle } from '../specStudioService'
import type { SpecTemplateFile } from '../specsService'
import { parseProjectTasks } from '../projectTasksService'
import { findFirstRunnableSpecTasksPath, findFirstOpenSpecTask } from '../specTaskExecutionService'
import type { FileItem } from '../../types/file'

export function slugifyGoalForSpecName(goal: string): string {
  const trimmed = goal.trim().slice(0, 48)
  const slug =
    trimmed
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'goal-drive'
  return slug.slice(0, 40)
}

/** Heuristic task lines from a free-text goal (no LLM). */
export function decomposeGoalToTaskLines(goal: string, locale: Language = 'zh-CN'): string[] {
  const isEn = locale === 'en-US'
  const chunks = goal
    .split(/[。；;\n]+/)
    .map((part) => part.trim().replace(/^[-*]\s+/, ''))
    .filter((part) => part.length >= 4 && part.length <= 200)

  const tasks: string[] = []
  const seen = new Set<string>()
  for (const chunk of chunks) {
    const key = chunk.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tasks.push(chunk)
    if (tasks.length >= 5) break
  }

  const defaults = isEn
    ? ['Align acceptance criteria with the goal', 'Implement core change', 'Verify acceptance checklist']
    : ['对齐 acceptance 与目标', '实现核心改动', '验收 acceptance 清单']

  for (const item of defaults) {
    if (tasks.length >= 6) break
    const key = item.slice(0, 8).toLowerCase()
    if (!tasks.some((t) => t.toLowerCase().includes(key))) tasks.push(item)
  }

  return tasks
}

function buildTasksMarkdown(taskLines: string[], locale: Language): string {
  const title = locale === 'en-US' ? 'Tasks' : '任务'
  const body = taskLines.map((line) => `- [ ] ${line}`).join('\n')
  return `# ${title}\n\n${body}\n`
}

export function buildGoalDrivenSpecBundle(
  goal: string,
  locale: Language = 'zh-CN',
  taskLinesOverride?: string[],
) {
  const specName = slugifyGoalForSpecName(goal)
  const bundle = createSpecStudioBundle('ai-agent-task', specName, locale)
  const taskLines = taskLinesOverride?.length
    ? taskLinesOverride
    : decomposeGoalToTaskLines(goal, locale)
  const files = bundle.files.map((file) => {
    if (file.path.endsWith('/requirements.md')) {
      return { ...file, content: injectUserGoalIntoRequirements(file.content, goal, locale) }
    }
    if (file.path.endsWith('/tasks.md')) {
      return { ...file, content: buildTasksMarkdown(taskLines, locale) }
    }
    return file
  })
  return { ...bundle, files, goalSummary: goal.trim().slice(0, 240) }
}

export type PrepareGoalDrivenWorkspaceResult =
  | { ok: false; reason: 'empty-goal' }
  | {
      ok: true
      files: FileItem[]
      tasksPath: string
      created: boolean
      openTasks: number
    }

function applyBundleFiles<T extends FileItem>(files: T[], bundleFiles: SpecTemplateFile[]): T[] {
  const next = [...files]
  for (const item of bundleFiles) {
    const index = next.findIndex((f) => f.name.replace(/\\/g, '/') === item.path.replace(/\\/g, '/'))
    const lang = item.path.endsWith('.ts') || item.path.endsWith('.tsx') ? 'typescript' : 'markdown'
    if (index >= 0) {
      next[index] = { ...next[index], content: item.content, language: lang }
    } else {
      next.push({ name: item.path, content: item.content, language: lang } as T)
    }
  }
  return next
}

export function prepareGoalDrivenWorkspace(
  files: FileItem[],
  goal: string,
  locale: Language = 'zh-CN',
  options?: { taskLines?: string[] },
): PrepareGoalDrivenWorkspaceResult {
  const trimmed = goal.trim()
  if (!trimmed) return { ok: false, reason: 'empty-goal' }

  const runnablePath = findFirstRunnableSpecTasksPath(files)
  if (runnablePath && findFirstOpenSpecTask(files, runnablePath)) {
    const normalized = runnablePath.replace(/\\/g, '/')
    const next = files.map((file) => {
      if (!file.name.replace(/\\/g, '/').endsWith('/requirements.md')) return file
      const specDir = normalized.replace(/\/tasks\.md$/i, '')
      if (!file.name.replace(/\\/g, '/').startsWith(`${specDir}/`)) return file
      return {
        ...file,
        content: injectUserGoalIntoRequirements(file.content, trimmed, locale),
      }
    })
    const openTasks = parseProjectTasks(
      next.find((f) => f.name.replace(/\\/g, '/') === normalized)?.content ?? '',
    ).filter((t) => !t.done).length
    return { ok: true, files: next, tasksPath: normalized, created: false, openTasks }
  }

  const bundle = buildGoalDrivenSpecBundle(trimmed, locale, options?.taskLines)
  const nextFiles = applyBundleFiles(files, bundle.files)
  const openTasks = parseProjectTasks(
    nextFiles.find((f) => f.name.replace(/\\/g, '/') === bundle.tasksPath.replace(/\\/g, '/'))?.content ?? '',
  ).filter((t) => !t.done).length

  return {
    ok: true,
    files: nextFiles,
    tasksPath: bundle.tasksPath.replace(/\\/g, '/'),
    created: true,
    openTasks,
  }
}
