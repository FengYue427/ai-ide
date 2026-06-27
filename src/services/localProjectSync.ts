import { localProjectService } from './localProjectService'
import { normalizeProjectPath } from './localProjectPaths'
import type { FileItem } from '../types/file'

export type LocalSyncResult = { ok: true } | { ok: false; error: string }

/** Write editor/workspace changes back to bound local folder. */
export async function syncToLocalDisk(path: string, content: string): Promise<LocalSyncResult> {
  if (!localProjectService.isBound()) return { ok: true }
  const normalized = normalizeProjectPath(path)
  if (!normalized) return { ok: true }
  try {
    await localProjectService.writeFile(normalized, content)
    return { ok: true }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.warn('[localProjectSync] write failed:', normalized, e)
    return { ok: false, error }
  }
}

/** Flush in-memory workspace files to the bound local project folder. */
export async function syncWorkspaceToLocalDisk(files: FileItem[]): Promise<LocalSyncResult> {
  for (const file of files) {
    const result = await syncToLocalDisk(file.name, file.content)
    if (!result.ok) return result
  }
  return { ok: true }
}
