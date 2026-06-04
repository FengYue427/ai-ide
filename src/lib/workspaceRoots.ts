import type { FileItem } from '../types/file'
import type { WorkspaceRoot, WorkspaceRootsMeta } from '../types/workspaceRoot'

export const WORKSPACE_ROOTS_META_KEY = 'workspace-roots-v1'
export const LEGACY_AUTOSAVE_KEY = 'autosave-default'
export const MAX_WORKSPACE_ROOTS = 6

export function workspaceAutosaveKey(rootId: string): string {
  return `autosave-${rootId}`
}

export function createWorkspaceRootId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `root-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createWorkspaceRoot(
  name: string,
  files: FileItem[],
  id = createWorkspaceRootId(),
): WorkspaceRoot {
  return {
    id,
    name,
    files,
    autosaveKey: workspaceAutosaveKey(id),
  }
}

export function defaultWorkspaceRoot(files: FileItem[]): WorkspaceRoot {
  return createWorkspaceRoot('default', files, 'default')
}

export function syncFilesToActiveRoot(
  roots: WorkspaceRoot[],
  activeRootId: string,
  files: FileItem[],
): WorkspaceRoot[] {
  return roots.map((root) => (root.id === activeRootId ? { ...root, files } : root))
}

export function getActiveWorkspaceRoot(
  roots: WorkspaceRoot[],
  activeRootId: string,
): WorkspaceRoot | undefined {
  return roots.find((root) => root.id === activeRootId)
}

export function nextWorkspaceRootName(roots: WorkspaceRoot[]): string {
  const used = new Set(roots.map((r) => r.name.toLowerCase()))
  for (let i = roots.length + 1; i < 99; i += 1) {
    const candidate = `root-${i}`
    if (!used.has(candidate)) return candidate
  }
  return `root-${Date.now()}`
}

export function toWorkspaceRootsMeta(roots: WorkspaceRoot[], activeRootId: string): WorkspaceRootsMeta {
  return {
    activeRootId,
    roots: roots.map(({ id, name, autosaveKey }) => ({ id, name, autosaveKey })),
  }
}

/** Keep active tab index valid after file list shrinks (delete file / switch root). */
export function clampActiveFileIndex(activeFile: number, fileCount: number): number {
  if (fileCount <= 0) return 0
  return Math.min(Math.max(0, activeFile), fileCount - 1)
}

export function hydrateRootsFromMeta(
  meta: WorkspaceRootsMeta,
  filesByRootId: Map<string, FileItem[]>,
  fallbackFiles: FileItem[],
): WorkspaceRoot[] {
  if (!meta.roots.length) {
    return [defaultWorkspaceRoot(fallbackFiles)]
  }

  return meta.roots.map((entry) => ({
    id: entry.id,
    name: entry.name,
    autosaveKey: entry.autosaveKey,
    files:
      filesByRootId.get(entry.id) ??
      (entry.id === meta.activeRootId && fallbackFiles.length > 0 ? fallbackFiles : []),
  }))
}
