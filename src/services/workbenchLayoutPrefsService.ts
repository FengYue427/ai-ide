import {
  WORKBENCH_LAYOUT_PREFS_KEY,
  normalizeWorkbenchLayoutPrefs,
  type WorkbenchLayoutPrefs,
  type WorkbenchLayoutStoreSlice,
} from '../lib/workbenchLayoutPrefs'
import { loadWorkbenchLayoutPrefsSync, saveWorkbenchLayoutPrefsSync } from '../lib/workbenchLayoutPrefsStorage'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

export async function loadWorkbenchLayoutPrefs(): Promise<WorkbenchLayoutPrefs | null> {
  const sync = loadWorkbenchLayoutPrefsSync()
  if (sync) return sync
  const stored = await unifiedStorage.get<unknown>(WORKBENCH_LAYOUT_PREFS_KEY, null)
  return normalizeWorkbenchLayoutPrefs(stored)
}

export async function saveWorkbenchLayoutPrefs(state: WorkbenchLayoutStoreSlice): Promise<WorkbenchLayoutPrefs> {
  const next = saveWorkbenchLayoutPrefsSync(state)
  await unifiedStorage.set(WORKBENCH_LAYOUT_PREFS_KEY, next, { layer: StorageLayer.LOCAL })
  return next
}

export { loadWorkbenchLayoutPrefsSync, saveWorkbenchLayoutPrefsSync }
