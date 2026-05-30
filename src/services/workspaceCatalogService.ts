import { serviceText } from '../lib/serviceI18n'
import { cloudSyncService, type WorkspaceBackup } from './cloudSyncService'
import type { WorkspaceCloudSaveResult } from './authService'
import { remoteWorkspaceService, type WorkspaceEntry, type WorkspaceSource } from './remoteWorkspaceService'

export type { WorkspaceEntry, WorkspaceSource }

/** List workspaces: cloud-first when logged in, merged with local-only backups. */
export async function listWorkspaceEntries(isLoggedIn: boolean): Promise<WorkspaceEntry[]> {
  const local = (await cloudSyncService.getAllWorkspaces()).map((workspace) => ({
    ...workspace,
    source: 'local' as const,
  }))

  if (!isLoggedIn) {
    return local
  }

  const cloud = await remoteWorkspaceService.listMetadata()
  const cloudNames = new Set(cloud.map((w) => w.name))
  const localOnly = local.filter((w) => !cloudNames.has(w.name))

  return [...cloud, ...localOnly].sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function loadWorkspaceEntry(
  entry: WorkspaceEntry,
  isLoggedIn: boolean,
): Promise<Pick<WorkspaceBackup, 'files' | 'settings'> | null> {
  if (entry.source === 'cloud' && isLoggedIn) {
    const full = await remoteWorkspaceService.fetchFull(entry.name)
    if (full) return { files: full.files, settings: full.settings }
  }

  if (entry.files.length > 0) {
    return { files: entry.files, settings: entry.settings }
  }

  const local = await cloudSyncService.getWorkspaceById(entry.id)
  if (local) return { files: local.files, settings: local.settings }

  return null
}

export async function saveWorkspaceEntry(
  name: string,
  files: WorkspaceBackup['files'],
  settings: WorkspaceBackup['settings'],
  description: string | undefined,
  isLoggedIn: boolean,
): Promise<{
  ok: boolean
  error?: string
  cloudResult?: WorkspaceCloudSaveResult
}> {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: serviceText('workspace.nameRequired') }

  if (isLoggedIn) {
    const cloudResult = await remoteWorkspaceService.save(trimmed, files, settings, description)
    if (!cloudResult.ok) {
      return {
        ok: false,
        error: serviceText('workspace.cloudSaveFailed'),
        cloudResult,
      }
    }
    return { ok: true, cloudResult }
  }

  await cloudSyncService.saveWorkspace(trimmed, files, settings, description)
  return { ok: true }
}

export async function deleteWorkspaceEntry(
  entry: WorkspaceEntry,
  isLoggedIn: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (entry.source === 'cloud' && isLoggedIn) {
    return remoteWorkspaceService.remove(entry.name)
  }

  await cloudSyncService.deleteWorkspace(entry.id)
  return { ok: true }
}
