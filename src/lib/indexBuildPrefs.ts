/** v1.4 F2 — index build mode preference (sync vs worker). */

export type IndexBuildModePreference = 'auto' | 'sync' | 'worker'

const MODE_KEY = 'ai-ide:index-build-mode'

export function getIndexBuildModePreference(): IndexBuildModePreference {
  if (typeof localStorage === 'undefined') return 'auto'
  const raw = localStorage.getItem(MODE_KEY)
  if (raw === 'sync' || raw === 'worker' || raw === 'auto') return raw
  return 'auto'
}

export function setIndexBuildModePreference(mode: IndexBuildModePreference): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MODE_KEY, mode)
}
