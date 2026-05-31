export const GIT_STATUS_REFRESH_PREFS_KEY = 'git-status-refresh-prefs'

/** Debounce auto Git status refresh after workspace file changes (v1.1.6.7). */
export const GIT_STATUS_REFRESH_DEBOUNCE_MS = 300

export type GitStatusRefreshPrefs = {
  manualRefreshOnly: boolean
}

export function defaultGitStatusRefreshPrefs(): GitStatusRefreshPrefs {
  return { manualRefreshOnly: false }
}

export function normalizeGitStatusRefreshPrefs(raw: unknown): GitStatusRefreshPrefs {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    manualRefreshOnly: record.manualRefreshOnly === true,
  }
}

export function loadGitStatusRefreshPrefs(): GitStatusRefreshPrefs {
  if (typeof localStorage === 'undefined') return defaultGitStatusRefreshPrefs()
  try {
    const raw = localStorage.getItem(GIT_STATUS_REFRESH_PREFS_KEY)
    if (!raw) return defaultGitStatusRefreshPrefs()
    return normalizeGitStatusRefreshPrefs(JSON.parse(raw))
  } catch {
    return defaultGitStatusRefreshPrefs()
  }
}

export function saveGitStatusRefreshPrefs(prefs: GitStatusRefreshPrefs): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GIT_STATUS_REFRESH_PREFS_KEY, JSON.stringify(prefs))
}

export function gitStatusRefreshDelayMs(trigger: 'auto' | 'manual'): number {
  return trigger === 'manual' ? 0 : GIT_STATUS_REFRESH_DEBOUNCE_MS
}
