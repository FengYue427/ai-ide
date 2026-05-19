import type { FileItem } from '../types/file'
import type { GitFileSyncUpdate } from '../services/gitService'
import { workspaceContextService } from '../services/workspaceContextService'

/** Apply Git worktree updates back into open editor tabs. */
export function applyGitSyncToFiles(files: FileItem[], updates: GitFileSyncUpdate[]): FileItem[] {
  let next = [...files]

  for (const update of updates) {
    const index = next.findIndex((file) => file.name === update.path)
    if (update.content === null) {
      if (index >= 0) next = next.filter((_, i) => i !== index)
      continue
    }
    if (index >= 0) {
      next[index] = { ...next[index], content: update.content }
    }
  }

  return next
}

/** Sync Git worktree updates into the multi-file workspace context (IndexedDB). */
export async function applyGitSyncToWorkspace(updates: GitFileSyncUpdate[]): Promise<void> {
  for (const update of updates) {
    if (update.content === null) {
      if (workspaceContextService.getFile(update.path)) {
        await workspaceContextService.removeFile(update.path)
      }
      continue
    }

    if (workspaceContextService.getFile(update.path)) {
      await workspaceContextService.updateFile(update.path, update.content)
    }
  }
}
