export const TASKS_PANEL_COLLAPSE_KEY = 'tasks-panel-collapse'

/** Items shown per group before "show more". */
export const TASKS_PANEL_ITEMS_PREVIEW = 12

/** Auto-collapse completed groups when total checklist items exceed this. */
export const TASKS_PANEL_AUTO_COLLAPSE_THRESHOLD = 24

export type TasksPanelCollapsePrefs = {
  collapsedPaths: string[]
}

export function normalizeTasksPanelCollapsePrefs(raw: unknown): TasksPanelCollapsePrefs {
  if (!raw || typeof raw !== 'object') return { collapsedPaths: [] }
  const record = raw as Record<string, unknown>
  const collapsedPaths = Array.isArray(record.collapsedPaths)
    ? record.collapsedPaths.filter((p): p is string => typeof p === 'string' && p.length > 0)
    : []
  return { collapsedPaths: [...new Set(collapsedPaths)] }
}

export function pathsForAutoCollapsedGroups(
  groups: Array<{ path: string; items: Array<{ done: boolean }> }>,
  totalItemCount: number,
): string[] {
  if (totalItemCount < TASKS_PANEL_AUTO_COLLAPSE_THRESHOLD) return []
  return groups
    .filter((group) => group.items.length > 0 && group.items.every((item) => item.done))
    .map((group) => group.path)
}
