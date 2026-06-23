import { isDesktopApp, getDesktopApi } from './desktopBridge'
import { getElectronRootPath } from './localProjectService'
import * as gitService from './gitService'

export type GitRemoteSyncAction = 'pull' | 'push'

export async function resolveGitOriginRemote(fs: unknown): Promise<string | null> {
  if (isDesktopApp()) {
    const root = getElectronRootPath()
    const api = getDesktopApi()
    if (root && api?.readGitOriginRemote) {
      const result = await api.readGitOriginRemote(root)
      if (result.ok) return result.url
    }
  }

  if (!fs) return null
  return gitService.getOriginRemoteUrl(fs, '/')
}

export async function runGitRemoteSync(
  fs: unknown,
  action: GitRemoteSyncAction,
  syncWorkspaceToFs?: () => Promise<void>,
): Promise<void> {
  if (isDesktopApp()) {
    const root = getElectronRootPath()
    const api = getDesktopApi()
    if (root && api?.syncGitOrigin) {
      const result = await api.syncGitOrigin(root, action)
      if (!result.ok) {
        throw new Error(result.detail || result.reason)
      }
      return
    }
  }

  if (!fs) throw new Error('GIT_FS_UNAVAILABLE')
  if (syncWorkspaceToFs) await syncWorkspaceToFs()

  if (action === 'pull') {
    await gitService.pullFromOrigin(fs, '/')
    return
  }

  await gitService.pushToOrigin(fs, '/')
}
