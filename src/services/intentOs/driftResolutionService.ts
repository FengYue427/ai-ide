import { acceptancePathFromTasksPath } from './acceptanceEditorService'
import { findLatestProofForTasksPath } from './intentReplayService'
import type { FileItem } from '../../types/file'
import type { SpecDriftReport } from './specDriftService'

export type DriftResolutionActionKind =
  | 'open-tasks'
  | 'open-acceptance'
  | 'open-file'
  | 'open-proof'
  | 'open-requirements'
  | 'open-design'

export interface DriftResolutionAction {
  id: string
  kind: DriftResolutionActionKind
  labelKey: `intent.drift.action.${DriftResolutionActionKind}`
  path?: string
}

function specBundlePathFromTasks(tasksPath: string, file: 'requirements' | 'design'): string {
  return tasksPath.replace(/[\\/]tasks\.md$/i, `/${file}.md`)
}

function fileExists(files: FileItem[] | undefined, path: string): boolean {
  if (!files) return false
  const normalized = path.replace(/\\/g, '/')
  return files.some((file) => file.name.replace(/\\/g, '/') === normalized)
}

export function buildDriftResolutionActions(
  report: SpecDriftReport,
  files?: FileItem[],
): DriftResolutionAction[] {
  const actions: DriftResolutionAction[] = []
  const tasksPath = report.tasksPath

  for (const item of report.items) {
    if (item.kind === 'open-task') {
      actions.push({
        id: `tasks-${tasksPath}`,
        kind: 'open-tasks',
        labelKey: 'intent.drift.action.open-tasks',
        path: tasksPath,
      })
      const requirementsPath = specBundlePathFromTasks(tasksPath, 'requirements')
      if (fileExists(files, requirementsPath)) {
        actions.push({
          id: `requirements-${tasksPath}`,
          kind: 'open-requirements',
          labelKey: 'intent.drift.action.open-requirements',
          path: requirementsPath,
        })
      }
      const designPath = specBundlePathFromTasks(tasksPath, 'design')
      if (fileExists(files, designPath)) {
        actions.push({
          id: `design-${tasksPath}`,
          kind: 'open-design',
          labelKey: 'intent.drift.action.open-design',
          path: designPath,
        })
      }
    }
    if (item.kind === 'open-acceptance') {
      actions.push({
        id: `acceptance-${item.path ?? acceptancePathFromTasksPath(tasksPath)}`,
        kind: 'open-acceptance',
        labelKey: 'intent.drift.action.open-acceptance',
        path: item.path ?? acceptancePathFromTasksPath(tasksPath),
      })
    }
    if (item.kind === 'missing-path' && item.path) {
      actions.push({
        id: `file-${item.path}`,
        kind: 'open-file',
        labelKey: 'intent.drift.action.open-file',
        path: item.path,
      })
    }
  }

  if (files) {
    const proofPath = findLatestProofForTasksPath(files, tasksPath)
    if (proofPath) {
      actions.push({
        id: `proof-${tasksPath}`,
        kind: 'open-proof',
        labelKey: 'intent.drift.action.open-proof',
        path: proofPath,
      })
    }
  }

  const seen = new Set<string>()
  return actions.filter((action) => {
    const key = `${action.kind}:${action.path ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function pickPrimaryDriftAction(report: SpecDriftReport, files?: FileItem[]): DriftResolutionAction | null {
  const actions = buildDriftResolutionActions(report, files)
  return actions[0] ?? null
}

export function hasResolvableDrift(tasksPath: string, reports: Record<string, SpecDriftReport>): boolean {
  const normalized = tasksPath.replace(/\\/g, '/')
  const report = reports[normalized]
  if (!report || report.severity === 'none') return false
  return buildDriftResolutionActions(report).length > 0
}
