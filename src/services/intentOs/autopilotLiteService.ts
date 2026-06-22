import type { FileItem } from '../../types/file'
import { parseProjectTasks } from '../projectTasksService'

export interface AutopilotLiteSuggestion {
  tasksPath: string
  taskText: string
  reason: 'next-open-task'
}

export function countOpenSpecTasks(files: FileItem[], tasksPath: string): number {
  const normalized = tasksPath.replace(/\\/g, '/')
  const file = files.find((f) => f.name.replace(/\\/g, '/') === normalized)
  if (!file) return 0
  return parseProjectTasks(file.content).filter((task) => !task.done).length
}

/** C6 — suggest the next open spec task (no auto-send). */
export function suggestNextSpecTask(files: FileItem[], tasksPath: string): AutopilotLiteSuggestion | null {
  const normalized = tasksPath.replace(/\\/g, '/')
  const file = files.find((f) => f.name.replace(/\\/g, '/') === normalized)
  if (!file) return null
  const next = parseProjectTasks(file.content).find((task) => !task.done)
  if (!next) return null
  return { tasksPath: normalized, taskText: next.text, reason: 'next-open-task' }
}
