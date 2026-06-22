import type { Language } from '../../i18n'
import { createSpecStudioBundle } from '../specStudioService'
import type { SpecTemplateFile } from '../specsService'

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface PromoteToSpecInput {
  messages: ConversationTurn[]
  specName: string
  locale?: Language
  /** Use last N user turns (default 3). */
  maxUserTurns?: number
}

const TASK_LINE = /^[-*]\s+(?:\[[ xX]\]\s+)?(.+)$/
const HEADING = /^#{1,3}\s+(.+)$/

function collectUserContext(messages: ConversationTurn[], maxUserTurns: number): string {
  const users = messages.filter((m) => m.role === 'user' && m.content.trim()).slice(-maxUserTurns)
  return users.map((m) => m.content.trim()).join('\n\n')
}

function collectAssistantTasks(messages: ConversationTurn[]): string[] {
  const tasks: string[] = []
  const seen = new Set<string>()
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const line of message.content.split(/\r?\n/)) {
      const trimmed = line.trim()
      const taskMatch = trimmed.match(TASK_LINE)
      if (taskMatch?.[1]) {
        const text = taskMatch[1].trim()
        const key = text.toLowerCase()
        if (!seen.has(key) && text.length > 2) {
          seen.add(key)
          tasks.push(text)
        }
      }
    }
  }
  return tasks.slice(0, 8)
}

function extractGoalLines(text: string): string[] {
  const lines: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('```')) continue
    const heading = trimmed.match(HEADING)
    if (heading) {
      lines.push(heading[1].trim())
      continue
    }
    if (trimmed.length >= 8 && trimmed.length <= 240) {
      lines.push(trimmed.replace(/^[-*]\s+/, ''))
    }
  }
  const unique = [...new Set(lines.map((l) => l.toLowerCase()))].map(
    (key) => lines.find((l) => l.toLowerCase() === key)!,
  )
  return unique.slice(0, 6)
}

function buildRequirementsContent(goal: string, goals: string[], locale: Language): string {
  const date = new Date().toISOString().slice(0, 10)
  const title = locale === 'en-US' ? 'Requirements (from conversation)' : '需求（由对话沉淀）'
  const goalSection =
    goals.length > 0
      ? goals.map((g) => `- ${g}`).join('\n')
      : locale === 'en-US'
        ? `- ${goal || 'Define the feature goal'}`
        : `- ${goal || '明确功能目标'}`
  const nonGoals =
    locale === 'en-US'
      ? '- Out of scope for this iteration\n'
      : '- 本轮不做范围外功能\n'
  return `# ${title}\n\n- Date: ${date}\n- Source: chat promote\n\n## Goals\n\n${goalSection}\n\n## Non-goals\n\n${nonGoals}`
}

function buildTasksContent(taskLines: string[], locale: Language): string {
  const title = locale === 'en-US' ? 'Tasks' : '任务'
  const defaults =
    locale === 'en-US'
      ? ['Align acceptance criteria', 'Implement core change', 'Verify acceptance.md']
      : ['对齐 acceptance 标准', '实现核心改动', '更新 acceptance.md 并验收']
  const merged = [...taskLines]
  for (const d of defaults) {
    if (merged.length >= 7) break
    if (!merged.some((t) => t.toLowerCase().includes(d.slice(0, 6).toLowerCase()))) {
      merged.push(d)
    }
  }
  const body = merged.map((t) => `- [ ] ${t}`).join('\n')
  return `# ${title}\n\n${body}\n`
}

function mergeFileContent(files: SpecTemplateFile[], path: string, content: string): SpecTemplateFile[] {
  const index = files.findIndex((f) => f.path === path)
  if (index < 0) return [...files, { path, content }]
  return files.map((f, i) => (i === index ? { ...f, content } : f))
}

/** Turn recent chat into an executable Spec bundle (S5). */
export function promoteConversationToSpecBundle(input: PromoteToSpecInput) {
  const locale = input.locale ?? 'zh-CN'
  const specName = input.specName.trim() || (locale === 'en-US' ? 'from-chat' : '来自对话')
  const userContext = collectUserContext(input.messages, input.maxUserTurns ?? 3)
  const assistantTasks = collectAssistantTasks(input.messages)
  const goals = extractGoalLines(userContext)
  const goal = goals[0] ?? userContext.split('\n')[0]?.trim() ?? ''

  const bundle = createSpecStudioBundle('ai-agent-task', specName, locale)
  const reqPath = bundle.files.find((f) => f.path.endsWith('/requirements.md'))?.path
  const tasksPath = bundle.tasksPath

  let files = [...bundle.files]
  if (reqPath) {
    files = mergeFileContent(files, reqPath, buildRequirementsContent(goal, goals, locale))
  }
  if (tasksPath) {
    files = mergeFileContent(files, tasksPath, buildTasksContent(assistantTasks, locale))
  }

  return {
    ...bundle,
    files,
    promotedFromChat: true as const,
    summary: goal || specName,
  }
}

export interface FileLike {
  name: string
  content: string
  language?: string
}

export function applySpecBundleToFiles<T extends FileLike>(
  files: T[],
  bundleFiles: SpecTemplateFile[],
): { files: T[]; tasksPath: string | null; firstIndex: number } {
  const next = [...files]
  for (const item of bundleFiles) {
    const index = next.findIndex((f) => f.name === item.path)
    if (index >= 0) {
      next[index] = { ...next[index], content: item.content, language: 'markdown' }
    } else {
      next.push({ name: item.path, content: item.content, language: 'markdown' } as T)
    }
  }
  const tasksPath = bundleFiles.find((f) => f.path.endsWith('/tasks.md'))?.path ?? null
  const firstPath = bundleFiles[0]?.path
  const firstIndex = firstPath ? next.findIndex((f) => f.name === firstPath) : -1
  return { files: next, tasksPath, firstIndex }
}
