import { isDesktopApp, getDesktopApi } from './desktopBridge'
import { parseGitPorcelainZ } from '../lib/parseGitPorcelain'
import { getElectronRootPath } from './localProjectService'
import type { GitStatus } from './gitService'

export const GIT_DESKTOP_CLI_PREFS_KEY = 'git-desktop-cli-enabled'

export type GitReadonlySnapshotSource = 'desktop-cli' | 'isomorphic'

export interface GitReadonlySnapshot {
  status: GitStatus[]
  branch: string | null
  branches: string[]
  source: GitReadonlySnapshotSource
}

export function isDesktopGitCliEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    const raw = localStorage.getItem(GIT_DESKTOP_CLI_PREFS_KEY)
    if (raw === null) return true
    return raw !== 'false'
  } catch {
    return true
  }
}

export function setDesktopGitCliEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GIT_DESKTOP_CLI_PREFS_KEY, enabled ? 'true' : 'false')
}

type DesktopGitIpcResult =
  | {
      ok: true
      statusPorcelain: string
      branch: string
      branches: string[]
    }
  | {
      ok: false
      reason: string
      detail?: string
    }

export async function tryDesktopGitReadonlySnapshot(): Promise<GitReadonlySnapshot | null> {
  if (!isDesktopApp() || !isDesktopGitCliEnabled()) return null

  const rootPath = getElectronRootPath()
  if (!rootPath) return null

  const api = getDesktopApi()
  if (!api?.readGitReadonlySnapshot) return null

  const result = (await api.readGitReadonlySnapshot(rootPath)) as DesktopGitIpcResult
  if (!result.ok) return null

  return {
    status: parseGitPorcelainZ(result.statusPorcelain),
    branch: result.branch || null,
    branches: result.branches.length > 0 ? result.branches : ['main'],
    source: 'desktop-cli',
  }
}
