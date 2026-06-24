/**
 * Sync read/write for workbench layout prefs (bootstrap must not await).
 */
import {
  WORKBENCH_LAYOUT_PREFS_KEY,
  normalizeWorkbenchLayoutPrefs,
  snapshotWorkbenchLayout,
  type WorkbenchLayoutPrefs,
  type WorkbenchLayoutStoreSlice,
} from '../lib/workbenchLayoutPrefs'

const STORAGE_PREFIX = 'ai-ide:'

function storageKey(): string {
  return `${STORAGE_PREFIX}${WORKBENCH_LAYOUT_PREFS_KEY}`
}

export function loadWorkbenchLayoutPrefsSync(): WorkbenchLayoutPrefs | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return null
    return normalizeWorkbenchLayoutPrefs(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveWorkbenchLayoutPrefsSync(state: WorkbenchLayoutStoreSlice): WorkbenchLayoutPrefs {
  const next = snapshotWorkbenchLayout(state)
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(next))
    } catch {
      // ignore quota / private mode
    }
  }
  return next
}
