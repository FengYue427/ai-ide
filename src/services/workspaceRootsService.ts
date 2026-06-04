import {
  hydrateRootsFromMeta,
  LEGACY_AUTOSAVE_KEY,
  toWorkspaceRootsMeta,
  WORKSPACE_ROOTS_META_KEY,
  defaultWorkspaceRoot,
} from '../lib/workspaceRoots'
import { isMultiRootWorkspaceEnabled } from '../lib/v12Features'
import type { FileItem } from '../types/file'
import type { WorkspaceRoot, WorkspaceRootsMeta } from '../types/workspaceRoot'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

const ROOT_PERSIST_LAYER = StorageLayer.INDEXED
import { loadLocalAutosaveFiles } from './workspaceAutosave'

type StoredFile = { name: string; content: string; language?: string }

function toFileItems(raw: StoredFile[] | null | undefined): FileItem[] | null {
  if (!raw?.length) return null
  return raw.map((file) => ({
    name: file.name,
    content: file.content,
    language: file.language || 'plaintext',
  }))
}

async function loadAutosaveByKey(key: string): Promise<FileItem[] | null> {
  const raw = await unifiedStorage.get<StoredFile[] | null>(key, null, {
    preferredLayer: ROOT_PERSIST_LAYER,
  })
  return toFileItems(raw)
}

export async function loadWorkspaceRootsMeta(): Promise<WorkspaceRootsMeta | null> {
  return unifiedStorage.get<WorkspaceRootsMeta | null>(WORKSPACE_ROOTS_META_KEY, null, {
    preferredLayer: ROOT_PERSIST_LAYER,
  })
}

export async function saveWorkspaceRootsMeta(meta: WorkspaceRootsMeta): Promise<void> {
  await unifiedStorage.set(WORKSPACE_ROOTS_META_KEY, meta, { layer: ROOT_PERSIST_LAYER })
}

/** Remove per-root IndexedDB autosave after the root is deleted from the UI. */
export async function deleteWorkspaceRootAutosave(autosaveKey: string): Promise<void> {
  if (!autosaveKey) return
  await unifiedStorage.remove(autosaveKey)
}

/** Bootstrap multi-root state from IndexedDB (or migrate legacy autosave-default). */
export async function loadWorkspaceRootsForBootstrap(
  fallbackFiles: FileItem[],
): Promise<{ roots: WorkspaceRoot[]; activeRootId: string }> {
  if (!isMultiRootWorkspaceEnabled()) {
    const root = defaultWorkspaceRoot(fallbackFiles)
    return { roots: [root], activeRootId: root.id }
  }

  let meta = await loadWorkspaceRootsMeta()
  if (!meta?.roots?.length) {
    const legacy = (await loadLocalAutosaveFiles(LEGACY_AUTOSAVE_KEY)) ?? fallbackFiles
    const root = defaultWorkspaceRoot(legacy.length ? legacy : fallbackFiles)
    meta = toWorkspaceRootsMeta([root], root.id)
    await saveWorkspaceRootsMeta(meta)
  }

  const filesByRootId = new Map<string, FileItem[]>()
  await Promise.all(
    meta.roots.map(async (entry) => {
      const key = entry.autosaveKey || LEGACY_AUTOSAVE_KEY
      const files = await loadAutosaveByKey(key)
      if (files?.length) filesByRootId.set(entry.id, files)
    }),
  )

  if (!filesByRootId.size) {
    const legacy = await loadLocalAutosaveFiles(LEGACY_AUTOSAVE_KEY)
    if (legacy?.length) filesByRootId.set(meta.activeRootId, legacy)
  }

  const activeFiles = filesByRootId.get(meta.activeRootId) ?? fallbackFiles
  const roots = hydrateRootsFromMeta(meta, filesByRootId, activeFiles)
  const activeRootId = roots.some((r) => r.id === meta!.activeRootId)
    ? meta!.activeRootId
    : roots[0].id

  return { roots, activeRootId }
}
