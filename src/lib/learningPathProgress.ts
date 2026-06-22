/**
 * Learning path progress — local persistence for started / completed paths.
 */
import type { FileItem } from '../types/file'
import { parseProjectTasks } from '../services/projectTasksService'
import { LEARNING_PATHS, type LearningPath } from './learningPaths'

export const LEARNING_PATH_PROGRESS_KEY = 'aide:learning-path-progress'
export const LEARNING_PATH_PROGRESS_EVENT = 'aide:learning-path-progress'

export interface LearningPathProgressRecord {
  startedAt: string
  completedAt?: string
}

export type LearningPathStatus = 'not_started' | 'in_progress' | 'completed'

function readMap(): Record<string, LearningPathProgressRecord> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LearningPathProgressRecord>
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, LearningPathProgressRecord>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LEARNING_PATH_PROGRESS_KEY, JSON.stringify(map))
    window.dispatchEvent(new Event(LEARNING_PATH_PROGRESS_EVENT))
  } catch {
    // ignore
  }
}

export function getLearningPathProgressMap(): Record<string, LearningPathProgressRecord> {
  return readMap()
}

export function getLearningPathStatus(pathId: string): LearningPathStatus {
  const record = readMap()[pathId]
  if (!record) return 'not_started'
  if (record.completedAt) return 'completed'
  return 'in_progress'
}

export function markLearningPathStarted(pathId: string): void {
  const map = readMap()
  if (map[pathId]?.completedAt) return
  map[pathId] = map[pathId] ?? { startedAt: new Date().toISOString() }
  if (!map[pathId].startedAt) {
    map[pathId].startedAt = new Date().toISOString()
  }
  writeMap(map)
}

export function markLearningPathCompleted(pathId: string): void {
  const map = readMap()
  const existing = map[pathId]
  map[pathId] = {
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }
  writeMap(map)
}

export function tasksPathForLearningPath(path: LearningPath): string {
  return `.aide/specs/${path.specName}/tasks.md`
}

export function isLearningPathSpecComplete(files: FileItem[], path: LearningPath): boolean {
  const expected = tasksPathForLearningPath(path)
  const file = files.find(
    (f) => f.name === expected || f.name.replace(/\\/g, '/').endsWith(`/${path.specName}/tasks.md`),
  )
  if (!file) return false
  const tasks = parseProjectTasks(file.content)
  return tasks.length > 0 && tasks.every((task) => task.done)
}

export function syncLearningPathCompletion(files: FileItem[]): void {
  const map = readMap()
  let changed = false
  for (const path of LEARNING_PATHS) {
    const record = map[path.id]
    if (!record || record.completedAt) continue
    if (!isLearningPathSpecComplete(files, path)) continue
    map[path.id] = {
      ...record,
      completedAt: new Date().toISOString(),
    }
    changed = true
  }
  if (changed) writeMap(map)
}
