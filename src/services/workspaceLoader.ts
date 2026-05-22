import { cloudSyncService } from './cloudSyncService'
import { listWorkspaceEntries, loadWorkspaceEntry } from './workspaceCatalogService'
import { authService } from './authService'
import { normalizeLanguage } from '../lib/language'
import { unifiedStorage } from './unifiedStorage'
import type { FileItem } from '../types/file'

export interface LoadedWorkspaceSettings {
  theme?: 'vs-dark' | 'light'
  autoSave?: boolean
  language?: string
}

export interface LoadedWorkspace {
  files: FileItem[]
  settings?: LoadedWorkspaceSettings
  name?: string
}

function normalizeFiles(
  raw: Array<{ name: string; content: string; language?: string }>,
): FileItem[] {
  return raw.map((file) => ({
    name: file.name,
    content: file.content,
    language: file.language || 'plaintext',
  }))
}

/** Load a workspace snapshot from local IndexedDB (no server required). */
export async function loadWorkspaceSnapshot(id: string): Promise<LoadedWorkspace | null> {
  const workspaces = await cloudSyncService.getAllWorkspaces()
  const saved = workspaces.find((workspace) => workspace.id === id)
  if (saved) {
    return {
      files: normalizeFiles(saved.files),
      settings: {
        theme: saved.settings.theme as 'vs-dark' | 'light',
        autoSave: saved.settings.autoSave,
        language: saved.settings.language,
      },
      name: saved.name,
    }
  }

  if (id === 'autosave-default' || id === 'local-autosave') {
    const autosave = await unifiedStorage.get<
      Array<{ name: string; content: string; language?: string }> | null
    >('autosave-default', null)
    if (autosave && autosave.length > 0) {
      const appSettings = await unifiedStorage.get<{ autosave?: boolean }>('settings', { autosave: true })
      const theme = await unifiedStorage.get<'vs-dark' | 'light'>('theme', 'vs-dark')
      const storedLang = await unifiedStorage.get<string>('language', 'zh-CN')
      return {
        files: normalizeFiles(autosave),
        settings: { theme, autoSave: appSettings.autosave, language: normalizeLanguage(storedLang) },
        name: '自动保存',
      }
    }
  }

  const autoBackup = await cloudSyncService.getAutoBackup()
  if (autoBackup && (autoBackup.id === id || id === 'auto-backup')) {
    return {
      files: normalizeFiles(autoBackup.files),
      settings: {
        theme: autoBackup.settings.theme as 'vs-dark' | 'light',
        autoSave: autoBackup.settings.autoSave,
        language: autoBackup.settings.language,
      },
      name: autoBackup.name,
    }
  }

  return null
}

/**
 * Resolve a recent-project id or name from local storage and cloud API (when logged in).
 */
export async function loadWorkspaceByRef(ref: string): Promise<LoadedWorkspace | null> {
  const local = await loadWorkspaceSnapshot(ref)
  if (local) return local

  if (!authService.getCurrentUser()) return null

  const entries = await listWorkspaceEntries(true)
  const entry =
    entries.find((workspace) => workspace.id === ref) ||
    entries.find((workspace) => workspace.name === ref)

  if (!entry) return null

  const payload = await loadWorkspaceEntry(entry, true)
  if (!payload) return null

  return {
    files: normalizeFiles(payload.files),
    settings: {
      theme: payload.settings.theme as 'vs-dark' | 'light' | undefined,
      autoSave: payload.settings.autoSave,
      language: payload.settings.language,
    },
    name: entry.name,
  }
}
