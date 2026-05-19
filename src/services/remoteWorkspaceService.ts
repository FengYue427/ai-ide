import { authService } from './authService'
import type { WorkspaceBackup } from './cloudSyncService'

export type WorkspaceSource = 'local' | 'cloud'

export interface WorkspaceEntry extends WorkspaceBackup {
  source: WorkspaceSource
  isDefault?: boolean
}

interface RemoteWorkspaceMeta {
  id: string
  name: string
  isDefault?: boolean
  updatedAt: string
}

function parseSettings(raw: string | null | undefined): WorkspaceBackup['settings'] {
  if (!raw) {
    return { theme: 'vs-dark', autoSave: true, language: 'zh' }
  }
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceBackup['settings']>
    return {
      theme: parsed.theme ?? 'vs-dark',
      autoSave: parsed.autoSave ?? true,
      language: parsed.language ?? 'zh',
      aiProvider: parsed.aiProvider,
      aiModel: parsed.aiModel,
    }
  } catch {
    return { theme: 'vs-dark', autoSave: true, language: 'zh' }
  }
}

function metaToEntry(meta: RemoteWorkspaceMeta): WorkspaceEntry {
  const updatedAt = Date.parse(meta.updatedAt) || Date.now()
  return {
    id: meta.id,
    name: meta.name,
    files: [],
    settings: { theme: 'vs-dark', autoSave: true, language: 'zh' },
    createdAt: updatedAt,
    updatedAt,
    source: 'cloud',
    isDefault: meta.isDefault,
  }
}

export const remoteWorkspaceService = {
  async listMetadata(): Promise<WorkspaceEntry[]> {
    if (!authService.getCurrentUser()) return []

    try {
      const res = await fetch('/api/workspaces', { credentials: 'include' })
      if (!res.ok) return []
      const data = (await res.json()) as { workspaces?: RemoteWorkspaceMeta[] }
      return (data.workspaces ?? []).map(metaToEntry)
    } catch {
      return []
    }
  },

  async fetchFull(name: string): Promise<WorkspaceEntry | null> {
    const loaded = await authService.loadWorkspace(name)
    if (!loaded) return null

    const settings: WorkspaceBackup['settings'] = loaded.settings
      ? {
          theme: loaded.settings.theme ?? 'vs-dark',
          autoSave: loaded.settings.autoSave ?? true,
          language: loaded.settings.language ?? 'zh',
          aiProvider: loaded.settings.aiProvider,
          aiModel: loaded.settings.aiModel,
        }
      : parseSettings(undefined)

    return {
      id: name,
      name,
      files: loaded.files,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'cloud',
    }
  },

  async save(
    name: string,
    files: WorkspaceBackup['files'],
    settings: WorkspaceBackup['settings'],
    description?: string,
  ): Promise<boolean> {
    const trimmed = name.trim()
    if (!trimmed || !authService.getCurrentUser()) return false

    const ok = await authService.saveWorkspace(files, settings, trimmed)
    if (!ok) return false

    // Mirror to local IndexedDB for offline fallback
    const { cloudSyncService } = await import('./cloudSyncService')
    const existing = (await cloudSyncService.getAllWorkspaces()).find((w) => w.name === trimmed)
    if (existing) {
      await cloudSyncService.updateWorkspace(existing.id, {
        name: trimmed,
        description,
        files,
        settings,
      })
    } else {
      await cloudSyncService.saveWorkspace(trimmed, files, settings, description)
    }
    return true
  },

  async remove(name: string): Promise<{ ok: boolean; error?: string }> {
    if (!authService.getCurrentUser()) {
      return { ok: false, error: '未登录' }
    }

    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        return { ok: false, error: data?.error || `HTTP ${res.status}` }
      }

      const { cloudSyncService } = await import('./cloudSyncService')
      const local = (await cloudSyncService.getAllWorkspaces()).find((w) => w.name === name)
      if (local) await cloudSyncService.deleteWorkspace(local.id)

      return { ok: true }
    } catch {
      return { ok: false, error: '网络错误' }
    }
  },
}
