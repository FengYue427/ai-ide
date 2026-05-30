import {
  sanitizeWorkspaceFilesForCloud,
  workspaceSanitizeHadOmissions,
  type WorkspaceFileLike,
  type WorkspaceSanitizeSummary,
} from '../../lib/api/workspacePayload'

export type WorkspaceCloudSyncPreview = {
  total: number
  syncable: number
  summary: WorkspaceSanitizeSummary
  hasOmissions: boolean
}

/** Preview what would upload to cloud before save (v1.1.4 F1). */
export function previewWorkspaceCloudSync(files: WorkspaceFileLike[]): WorkspaceCloudSyncPreview {
  const { files: syncableFiles, summary } = sanitizeWorkspaceFilesForCloud(files)
  return {
    total: files.length,
    syncable: syncableFiles.length,
    summary,
    hasOmissions: workspaceSanitizeHadOmissions(summary),
  }
}
