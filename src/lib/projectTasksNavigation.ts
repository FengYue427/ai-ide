import type { Language } from '../i18n'
import {
  PROJECT_TASKS_PATH,
  collectTasksSources,
  getDefaultProjectTasksTemplate,
  isProjectTasksPath,
  parseProjectTasks,
  type ProjectTaskItem,
} from '../services/projectTasksService'

export type TaskFileKind = 'project' | 'spec'

export type TaskFileGroup = {
  path: string
  kind: TaskFileKind
  specName?: string
  title: string
  items: ProjectTaskItem[]
}

const SPEC_TASKS_RE = /^\.aide\/specs\/([^/]+)\/tasks\.md$/i

function normalizeTaskPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

export function dedupeTaskSources(sources: { path: string; content: string }[]): { path: string; content: string }[] {
  const byPath = new Map<string, string>()
  for (const source of sources) {
    byPath.set(normalizeTaskPath(source.path), source.content)
  }
  return Array.from(byPath.entries()).map(([path, content]) => ({ path, content }))
}

export function listTaskFileGroups(sources: { path: string; content: string }[]): TaskFileGroup[] {
  return dedupeTaskSources(sources)
    .filter((source) => isProjectTasksPath(source.path))
    .map((source) => {
      const path = normalizeTaskPath(source.path)
      const specMatch = path.match(SPEC_TASKS_RE)
      const kind: TaskFileKind = specMatch ? 'spec' : 'project'
      const heading = source.content.match(/^#\s+(.+)\s*$/m)?.[1]?.trim()
      const title = heading || specMatch?.[1] || PROJECT_TASKS_PATH
      return {
        path,
        kind,
        specName: specMatch?.[1],
        title,
        items: parseProjectTasks(source.content),
      }
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'project' ? -1 : 1
      return a.path.localeCompare(b.path)
    })
}

export function listOpenTasksFromGroups(groups: TaskFileGroup[]): Array<{ path: string; text: string; line: number }> {
  return groups.flatMap((group) =>
    group.items
      .filter((item) => !item.done)
      .map((item) => ({ path: group.path, text: item.text, line: item.line })),
  )
}

export function buildOpenTasksAgentPrompt(
  openTasks: Array<{ path: string; text: string }>,
  locale: Language = 'zh-CN',
): string {
  if (openTasks.length === 0) return ''
  const header =
    locale === 'zh-CN'
      ? '请协助完成以下待办任务（来自 .aide/tasks 与 spec tasks）：'
      : 'Please help with these open tasks (from .aide/tasks and spec tasks):'
  const lines = openTasks.slice(0, 20).map((task) => `- [ ] ${task.text} (${task.path})`)
  return `${header}\n\n${lines.join('\n')}`
}

export function collectAllTaskSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): { path: string; content: string }[] {
  return dedupeTaskSources(collectTasksSources(editorFiles, workspaceFiles))
}

export function createProjectTasksFileEntry(locale: Language = 'zh-CN') {
  return {
    name: PROJECT_TASKS_PATH,
    content: getDefaultProjectTasksTemplate(locale),
    language: 'markdown' as const,
  }
}

export function findTaskFileIndex(files: { name: string }[], path: string): number {
  const normalized = normalizeTaskPath(path)
  return files.findIndex((file) => normalizeTaskPath(file.name) === normalized)
}
