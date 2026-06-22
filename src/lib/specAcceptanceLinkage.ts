/**
 * Phase 5.3 — Spec acceptance readiness for proof pack linkage.
 */
import type { FileItem } from '../types/file'
import { acceptancePathFromTasksPath, parseAcceptanceCriteria } from '../services/intentOs/acceptanceEditorService'
import { listSpecTasksPaths } from '../services/planSpecsBridgeService'
import { parseProjectTasks } from '../services/projectTasksService'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { specSlugFromPath } from './specStudioPaths'

export interface SpecAcceptanceLinkage {
  activeSpecSlug: string | null
  tasksPath: string | null
  acceptancePath: string | null
  openTaskCount: number
  openAcceptanceCount: number
  readyForProof: boolean
}

export function buildSpecAcceptanceLinkage(files: FileItem[]): SpecAcceptanceLinkage {
  const preview = buildRuntimeStatePreview(files)
  const tasksPath =
    preview.activeSpecPath ?? listSpecTasksPaths(files).find((path) => {
      const file = files.find((f) => f.name === path)
      if (!file) return false
      return parseProjectTasks(file.content).some((task) => !task.done)
    }) ?? listSpecTasksPaths(files)[0] ?? null

  if (!tasksPath) {
    return {
      activeSpecSlug: null,
      tasksPath: null,
      acceptancePath: null,
      openTaskCount: 0,
      openAcceptanceCount: 0,
      readyForProof: false,
    }
  }

  const tasksFile = files.find((f) => f.name === tasksPath)
  const openTaskCount = tasksFile
    ? parseProjectTasks(tasksFile.content).filter((task) => !task.done).length
    : 0
  const acceptancePath = acceptancePathFromTasksPath(tasksPath)
  const acceptanceFile = files.find((f) => f.name.replace(/\\/g, '/') === acceptancePath.replace(/\\/g, '/'))
  const criteria = acceptanceFile ? parseAcceptanceCriteria(acceptanceFile.content) : []
  const openAcceptanceCount = criteria.filter((item) => !item.checked).length
  const readyForProof =
    criteria.length > 0 && openAcceptanceCount === 0 && openTaskCount === 0

  return {
    activeSpecSlug: specSlugFromPath(tasksPath),
    tasksPath,
    acceptancePath,
    openTaskCount,
    openAcceptanceCount,
    readyForProof,
  }
}
