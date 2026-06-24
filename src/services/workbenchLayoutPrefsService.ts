import {
  WORKBENCH_LAYOUT_PREFS_KEY,
  normalizeWorkbenchLayoutPrefs,
  snapshotWorkbenchLayout,
  type WorkbenchLayoutPrefs,
  type WorkbenchLayoutStoreSlice,
} from '../lib/workbenchLayoutPrefs'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

export async function loadWorkbenchLayoutPrefs(): Promise<WorkbenchLayoutPrefs | null> {
  const stored = await unifiedStorage.get<unknown>(WORKBENCH_LAYOUT_PREFS_KEY, null)
  return normalizeWorkbenchLayoutPrefs(stored)
}

export async function saveWorkbenchLayoutPrefs(state: WorkbenchLayoutStoreSlice): Promise<WorkbenchLayoutPrefs> {
  const next = snapshotWorkbenchLayout(state)
  await unifiedStorage.set(WORKBENCH_LAYOUT_PREFS_KEY, next, { layer: StorageLayer.LOCAL })
  return next
}
