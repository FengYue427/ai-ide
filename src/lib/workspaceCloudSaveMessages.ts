import type { TranslateFn } from '../i18n'
import type { WorkspaceSanitizeSummary } from '../../lib/api/workspacePayload'
import { workspaceSanitizeHadOmissions } from '../../lib/api/workspacePayload'
import type { WorkspaceCloudSaveResult } from '../services/authService'

export function formatWorkspaceCloudSaveDetail(
  summary: WorkspaceSanitizeSummary | undefined,
  t: TranslateFn,
): string | undefined {
  if (!summary || !workspaceSanitizeHadOmissions(summary)) return undefined

  const parts: string[] = []
  if (summary.omittedOversized > 0) {
    parts.push(t('workspace.cloudSave.omittedOversized', { count: summary.omittedOversized }))
  }
  if (summary.omittedBinary > 0) {
    parts.push(t('workspace.cloudSave.omittedBinary', { count: summary.omittedBinary }))
  }
  if (summary.droppedForCount > 0) {
    parts.push(t('workspace.cloudSave.droppedCount', { count: summary.droppedForCount }))
  }
  if (summary.droppedForBodyBytes > 0) {
    parts.push(t('workspace.cloudSave.droppedBody', { count: summary.droppedForBodyBytes }))
  }
  if (summary.omittedInvalidName > 0) {
    parts.push(t('workspace.cloudSave.omittedInvalid', { count: summary.omittedInvalidName }))
  }

  return parts.length > 0
    ? t('workspace.cloudSave.partialDetail', { kept: summary.kept, details: parts.join(' · ') })
    : t('workspace.cloudSave.partialDetailShort', { kept: summary.kept })
}

export function workspaceCloudSaveToast(
  result: WorkspaceCloudSaveResult,
  t: TranslateFn,
): { kind: 'info' | 'error'; title: string; detail?: string } | null {
  if (result.ok) {
    const detail = formatWorkspaceCloudSaveDetail(result.summary, t)
    if (!detail) return null
    return { kind: 'info', title: t('workspace.cloudSave.partialTitle'), detail }
  }

  if (result.reason === 'payload_too_large') {
    return {
      kind: 'error',
      title: t('workspace.cloudSave.failed413Title'),
      detail:
        formatWorkspaceCloudSaveDetail(result.summary, t) ?? t('workspace.cloudSave.failed413Detail'),
    }
  }

  if (result.reason === 'not_logged_in') return null

  return {
    kind: 'error',
    title: t('workspace.cloudSave.failedTitle'),
    detail: t('workspace.cloudSave.failedDetail'),
  }
}
