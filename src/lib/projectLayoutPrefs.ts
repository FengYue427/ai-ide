/**
 * Phase 6.3 — per-project layout memory (mode + panel snapshot).
 */
import type { FileItem } from '../types/file'
import type { ModePanelSnapshot } from './modePanelPrefs'
import type { WorkspaceMode } from './workspaceMode'

export const PROJECT_LAYOUT_PREFS_KEY = 'aide:project-layout-prefs'

export interface ProjectLayoutSnapshot {
  workspaceMode: WorkspaceMode
  panels: ModePanelSnapshot
  savedAt: string
}

export type ProjectLayoutStore = Record<string, ProjectLayoutSnapshot>

function readStore(): ProjectLayoutStore {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PROJECT_LAYOUT_PREFS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ProjectLayoutStore
  } catch {
    return {}
  }
}

function writeStore(store: ProjectLayoutStore): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PROJECT_LAYOUT_PREFS_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function buildWorkspaceFingerprint(files: FileItem[]): string {
  const specPaths = files
    .map((f) => f.name.replace(/\\/g, '/'))
    .filter((name) => /^\.aide\/specs\//.test(name))
    .sort()
    .slice(0, 8)
  const anchor = specPaths[0] ?? files[0]?.name ?? 'empty'
  return `${files.length}:${anchor}`
}

export function saveProjectLayoutSnapshot(
  fingerprint: string,
  snapshot: Omit<ProjectLayoutSnapshot, 'savedAt'>,
): void {
  const store = readStore()
  store[fingerprint] = { ...snapshot, savedAt: new Date().toISOString() }
  writeStore(store)
}

export function loadProjectLayoutSnapshot(fingerprint: string): ProjectLayoutSnapshot | null {
  return readStore()[fingerprint] ?? null
}
