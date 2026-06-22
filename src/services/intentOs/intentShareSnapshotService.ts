import type { FileItem } from '../../types/file'
import { listSpecTasksPaths } from '../planSpecsBridgeService'
import { buildIntentGraph } from './intentGraphService'
import { parseProjectTasks } from '../projectTasksService'
import { buildRuntimeStatePreview } from '../runtime/runtimeStatePreview'
import { specSlugFromPath } from '../../lib/specStudioPaths'

export const INTENT_SHARE_META_PATH = '.aide/meta/intent-share.json'

export interface IntentShareSpecProgress {
  slug: string
  tasksPath: string
  openTasks: number
  doneTasks: number
  totalTasks: number
}

export interface IntentShareSnapshot {
  version: 1
  generatedAt: string
  activeSpecPath: string | null
  specs: IntentShareSpecProgress[]
  graph: ReturnType<typeof buildIntentGraph>
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function buildIntentShareSnapshot(files: FileItem[], now = new Date()): IntentShareSnapshot {
  const preview = buildRuntimeStatePreview(files)
  const tasksPaths = listSpecTasksPaths(files)
  const specs: IntentShareSpecProgress[] = []

  for (const tasksPath of tasksPaths) {
    const file = files.find((f) => normalizePath(f.name) === tasksPath)
    if (!file) continue
    const tasks = parseProjectTasks(file.content)
    const doneTasks = tasks.filter((t) => t.done).length
    specs.push({
      slug: specSlugFromPath(tasksPath) ?? tasksPath,
      tasksPath,
      openTasks: tasks.length - doneTasks,
      doneTasks,
      totalTasks: tasks.length,
    })
  }

  const focus = preview.activeSpecPath ?? tasksPaths[0] ?? null

  return {
    version: 1,
    generatedAt: now.toISOString(),
    activeSpecPath: preview.activeSpecPath,
    specs,
    graph: buildIntentGraph({ files, focusTasksPath: focus }),
  }
}

export function formatIntentShareSummary(snapshot: IntentShareSnapshot): string {
  if (snapshot.specs.length === 0) return ''
  const active = snapshot.activeSpecPath
    ? snapshot.specs.find((s) => s.tasksPath === snapshot.activeSpecPath)
    : snapshot.specs[0]
  if (!active) return `${snapshot.specs.length} spec(s) tracked`
  return `${active.slug}: ${active.doneTasks}/${active.totalTasks} tasks · graph ${snapshot.graph.nodes.length} nodes`
}

export function appendIntentSnapshotToShareFiles(files: FileItem[]): FileItem[] {
  if (listSpecTasksPaths(files).length === 0) return files
  const snapshot = buildIntentShareSnapshot(files)
  const content = JSON.stringify(snapshot, null, 2)
  const existing = files.findIndex((f) => normalizePath(f.name) === INTENT_SHARE_META_PATH)
  if (existing >= 0) {
    return files.map((f, i) => (i === existing ? { ...f, content } : f))
  }
  return [...files, { name: INTENT_SHARE_META_PATH, content, language: 'json' }]
}
