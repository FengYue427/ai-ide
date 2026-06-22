import type { FileItem } from '../../types/file'
import { parseProjectTasks } from '../projectTasksService'
import { parseAcceptanceMarkdown } from '../runtime/acceptanceRunner'

export interface SpecDriftItem {
  kind: 'open-task' | 'missing-path' | 'open-acceptance'
  message: string
  path?: string
  count?: number
}

export interface SpecDriftReport {
  tasksPath: string
  scannedAt: string
  items: SpecDriftItem[]
  severity: 'none' | 'info' | 'warn'
}

const PATH_IN_TASK = /`?((?:src|lib|app|api|tests|\.aide)\/[\w./\-]+\.\w+)`?/g

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

/** S2 — scan spec vs workspace after agent edits. */
export function scanSpecDrift(files: FileItem[], tasksPath: string, now = new Date()): SpecDriftReport {
  const normalized = normalizePath(tasksPath)
  const tasksFile = files.find((f) => normalizePath(f.name) === normalized)
  const items: SpecDriftItem[] = []

  if (!tasksFile) {
    return {
      tasksPath: normalized,
      scannedAt: now.toISOString(),
      items: [{ kind: 'missing-path', message: 'tasks.md missing', path: normalized }],
      severity: 'warn',
    }
  }

  const openTasks = parseProjectTasks(tasksFile.content).filter((t) => !t.done)
  if (openTasks.length > 0) {
    items.push({
      kind: 'open-task',
      message: `${openTasks.length} open task(s) remain`,
      count: openTasks.length,
    })
  }

  const index = new Set(files.map((f) => normalizePath(f.name)))
  for (const task of openTasks) {
    PATH_IN_TASK.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = PATH_IN_TASK.exec(task.text)) !== null) {
      const ref = normalizePath(match[1])
      if (!index.has(ref)) {
        items.push({
          kind: 'missing-path',
          message: `task references missing path: ${ref}`,
          path: ref,
        })
      }
    }
  }

  const acceptancePath = normalized.replace(/tasks\.md$/i, 'acceptance.md')
  const acceptanceFile = files.find((f) => normalizePath(f.name) === acceptancePath)
  if (acceptanceFile) {
    const parsed = parseAcceptanceMarkdown(acceptanceFile.content)
    if (parsed.uncheckedItems.length > 0) {
      items.push({
        kind: 'open-acceptance',
        message: `${parsed.uncheckedItems.length} acceptance item(s) unchecked`,
        path: acceptancePath,
        count: parsed.uncheckedItems.length,
      })
    }
  }

  const severity =
    items.some((i) => i.kind === 'missing-path') ? 'warn' : items.length > 0 ? 'info' : 'none'

  return {
    tasksPath: normalized,
    scannedAt: now.toISOString(),
    items,
    severity,
  }
}
