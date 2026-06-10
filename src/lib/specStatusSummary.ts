import type { FileItem } from '../types/file'
import { listSpecTasksPaths } from '../services/planSpecsBridgeService'
import { parseProjectTasks } from '../services/projectTasksService'
import { findFirstRunnableSpecTasksPath } from '../services/specTaskExecutionService'
import { specSlugFromPath } from './specStudioPaths'

export interface SpecStatusSummary {
  specCount: number
  openTaskCount: number
  runnableTasksPath: string | null
  activeSpecSlug: string | null
}

export function buildSpecStatusSummary(files: FileItem[]): SpecStatusSummary {
  const specTaskPaths = listSpecTasksPaths(files)
  let openTaskCount = 0
  for (const path of specTaskPaths) {
    const file = files.find((item) => item.name === path)
    if (!file) continue
    openTaskCount += parseProjectTasks(file.content).filter((task) => !task.done).length
  }
  const runnableTasksPath = findFirstRunnableSpecTasksPath(files)
  const activeSpecSlug = runnableTasksPath ? specSlugFromPath(runnableTasksPath) : null

  return {
    specCount: specTaskPaths.length,
    openTaskCount,
    runnableTasksPath,
    activeSpecSlug,
  }
}
