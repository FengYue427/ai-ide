import { tryDesktopGitReadonlySnapshot, type GitReadonlySnapshotSource } from '../services/desktopGitReadonly'
import * as gitService from '../services/gitService'
import type { GitStatus } from '../services/gitService'

export interface GitReadonlySnapshotResult {
  status: GitStatus[]
  branch: string | null
  branches: string[]
  source: GitReadonlySnapshotSource
}

/** Load status/branch from desktop git CLI when available, else isomorphic-git (v1.1.6.8). */
export async function loadGitReadonlySnapshot(
  fs: any,
  syncWorkspaceToFs?: () => Promise<void>,
): Promise<GitReadonlySnapshotResult | null> {
  if (!fs) return null

  const desktop = await tryDesktopGitReadonlySnapshot()
  if (desktop) {
    return desktop
  }

  if (syncWorkspaceToFs) {
    await syncWorkspaceToFs()
  }

  const [status, branch, branches] = await Promise.all([
    gitService.getStatus(fs, '/'),
    gitService.getCurrentBranch(fs, '/'),
    gitService.listBranches(fs, '/'),
  ])

  return {
    status,
    branch,
    branches,
    source: 'isomorphic',
  }
}
