import {
  BOTTOM_PANEL_DEFAULT_HEIGHT,
  BOTTOM_PANEL_PREFS_KEY,
  mergeBottomPanelPrefs,
  normalizeBottomPanelPrefs,
  type BottomPanelPrefs,
} from '../lib/bottomPanelPrefs'
import { StorageLayer, unifiedStorage } from './unifiedStorage'
import type { BottomPanelTab } from '../store/ideStore'

export async function loadBottomPanelPrefs(): Promise<BottomPanelPrefs> {
  const stored = await unifiedStorage.get<unknown>(BOTTOM_PANEL_PREFS_KEY, null)
  if (!stored) {
    return { tab: 'terminal', height: BOTTOM_PANEL_DEFAULT_HEIGHT }
  }
  return normalizeBottomPanelPrefs(stored)
}

export async function saveBottomPanelPrefs(patch: Partial<BottomPanelPrefs>): Promise<BottomPanelPrefs> {
  const current = await loadBottomPanelPrefs()
  const next = mergeBottomPanelPrefs(current, patch)
  await unifiedStorage.set(BOTTOM_PANEL_PREFS_KEY, next, { layer: StorageLayer.LOCAL })
  return next
}

export async function persistBottomPanelTab(tab: BottomPanelTab): Promise<void> {
  await saveBottomPanelPrefs({ tab })
}

export async function persistBottomPanelHeight(height: number): Promise<void> {
  await saveBottomPanelPrefs({ height })
}
