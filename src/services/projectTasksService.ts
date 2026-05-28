/**
 * Lightweight task checklist (.aide/tasks.md) — v1.0.2.6
 */

import type { Language } from '../i18n'
import { serviceText } from '../lib/serviceI18n'

export const PROJECT_TASKS_PATH = '.aide/tasks.md'

const TASK_PATH_PATTERNS = [
  /^\.aide\/tasks$/i,
  /^\.aide\/tasks\.md$/i,
  /^aide\.tasks\.md$/i,
  /^\.aide\/specs\/[^/]+\/tasks\.md$/i,
]

export type ProjectTaskItem = {
  text: string
  done: boolean
  line: number
}

export function isProjectTasksPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  return TASK_PATH_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function getDefaultProjectTasksTemplate(locale: Language = 'zh-CN'): string {
  return serviceText('projectTasks.template', undefined, locale)
}

/** Parse markdown `- [ ]` / `- [x]` checklist lines. */
export function parseProjectTasks(markdown: string): ProjectTaskItem[] {
  const items: ProjectTaskItem[] = []
  const lines = markdown.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s*-\s*\[( |x|X)\]\s+(.+)$/)
    if (!match) continue
    items.push({
      done: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
      line: i + 1,
    })
  }
  return items
}

export function extractProjectTasks(sources: { path: string; content: string }[]): ProjectTaskItem[] {
  for (const source of sources) {
    if (!isProjectTasksPath(source.path)) continue
    const items = parseProjectTasks(source.content)
    if (items.length > 0) return items
  }
  return []
}

export function summarizeProjectTasks(items: ProjectTaskItem[]): { total: number; done: number; open: number } {
  const total = items.length
  const done = items.filter((item) => item.done).length
  return { total, done, open: total - done }
}

export function appendOpenTasksToPrompt(basePrompt: string, items: ProjectTaskItem[], locale: Language = 'zh-CN'): string {
  const open = items.filter((item) => !item.done)
  if (open.length === 0) return basePrompt
  const title = serviceText('projectTasks.sectionTitle', undefined, locale)
  const lines = open.slice(0, 12).map((item) => `- [ ] ${item.text}`)
  return `${basePrompt}\n\n## ${title}\n\n${lines.join('\n')}\n`
}

export function collectTasksSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): { path: string; content: string }[] {
  return [
    ...editorFiles.map((file) => ({ path: file.name, content: file.content })),
    ...workspaceFiles.map((file) => ({ path: file.path, content: file.content })),
  ]
}
