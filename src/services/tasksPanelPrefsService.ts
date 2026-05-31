import {
  TASKS_PANEL_COLLAPSE_KEY,
  normalizeTasksPanelCollapsePrefs,
  type TasksPanelCollapsePrefs,
} from '../lib/tasksPanelPrefs'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

export async function loadTasksPanelCollapsePrefs(): Promise<TasksPanelCollapsePrefs> {
  const stored = await unifiedStorage.get<unknown>(TASKS_PANEL_COLLAPSE_KEY, null)
  if (!stored) return { collapsedPaths: [] }
  return normalizeTasksPanelCollapsePrefs(stored)
}

export async function saveTasksPanelCollapsePrefs(collapsedPaths: string[]): Promise<void> {
  const next = normalizeTasksPanelCollapsePrefs({ collapsedPaths })
  await unifiedStorage.set(TASKS_PANEL_COLLAPSE_KEY, next, { layer: StorageLayer.LOCAL })
}
