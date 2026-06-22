import type { FileItem } from '../../types/file'
import { parseProjectTasks } from '../projectTasksService'

export interface GroundingIssue {
  kind: 'missing-path' | 'missing-tasks-file'
  detail: string
  path?: string
}

export interface GroundingGateResult {
  ok: boolean
  issues: GroundingIssue[]
  summary?: string
}

const PATH_PATTERNS = [
  /`([./][\w./\-]+(?:\.\w+)?)`/g,
  /`([\w][\w./\-]*\/[\w./\-]+\.\w+)`/g,
  /\b((?:src|lib|app|api|tests|e2e|public|electron)\/[\w./\-]+\.\w+)\b/g,
  /\b(\.aide\/[\w./\-]+\.\w+)\b/g,
]

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function fileIndex(files: FileItem[]): Set<string> {
  const set = new Set<string>()
  for (const file of files) {
    set.add(normalizePath(file.name))
  }
  return set
}

function extractPathRefs(text: string): string[] {
  const refs = new Set<string>()
  for (const pattern of PATH_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1]?.trim()
      if (!raw || raw.length < 3) continue
      refs.add(normalizePath(raw))
    }
  }
  return [...refs]
}

/** S3 — reject enqueue when task references paths that do not exist in workspace. */
export function runGroundingGate(
  files: FileItem[],
  tasksPath: string,
  taskText: string,
): GroundingGateResult {
  const normalizedTasks = normalizePath(tasksPath)
  const index = fileIndex(files)
  const issues: GroundingIssue[] = []

  if (!index.has(normalizedTasks)) {
    issues.push({
      kind: 'missing-tasks-file',
      detail: `tasks file not found: ${normalizedTasks}`,
      path: normalizedTasks,
    })
  }

  const tasksFile = files.find((f) => normalizePath(f.name) === normalizedTasks)
  if (tasksFile) {
    const taskTexts = parseProjectTasks(tasksFile.content).map((t) => t.text.trim().toLowerCase())
    if (!taskTexts.includes(taskText.trim().toLowerCase())) {
      issues.push({
        kind: 'missing-path',
        detail: `task not found in tasks.md: ${taskText.slice(0, 80)}`,
        path: normalizedTasks,
      })
    }
  }

  for (const ref of extractPathRefs(taskText)) {
    if (ref.endsWith('.md') || ref.includes('/')) {
      if (!index.has(ref)) {
        issues.push({
          kind: 'missing-path',
          detail: `referenced path not in workspace: ${ref}`,
          path: ref,
        })
      }
    }
  }

  if (issues.length === 0) {
    return { ok: true, issues: [] }
  }

  const summary = issues.map((i) => i.detail).join('; ')
  return { ok: false, issues, summary }
}
