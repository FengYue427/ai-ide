import { cloudSyncService } from './cloudSyncService'
import { unifiedStorage } from './unifiedStorage'
import type { FileItem } from '../types/file'
import { pickRicherFileSet } from './workspaceSession'

type StoredFile = { name: string; content: string; language?: string }

function toFileItems(raw: StoredFile[] | null | undefined): FileItem[] | null {
  if (!raw?.length) return null
  return raw.map((file) => ({
    name: file.name,
    content: file.content,
    language: file.language || 'plaintext',
  }))
}

/** Local autosave key + optional auto-backup (whichever has more files). */
export async function loadLocalAutosaveFiles(
  autosaveKey = 'autosave-default',
): Promise<FileItem[] | null> {
  const autosave = await unifiedStorage.get<StoredFile[] | null>(autosaveKey, null)
  const backup = await cloudSyncService.getAutoBackup()
  const merged = pickRicherFileSet(autosave, backup?.files)
  return toFileItems(merged)
}
