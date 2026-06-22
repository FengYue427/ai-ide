import type { FileItem } from '../types/file'
import { buildSpecStatusSummary } from './specStatusSummary'

const INTENT_SHELL_LS = 'ai-ide:intent-shell-enabled'

function readIntentShellEnv(): boolean {
  const raw = import.meta.env.VITE_INTENT_SHELL
  if (raw === 'false' || raw === '0') return false
  if (raw === 'true' || raw === '1') return true
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ai-ide:feature:intentShell') === '1') {
      return true
    }
  } catch {
    // ignore
  }
  return true
}

export function isIntentShellFeatureEnabled(): boolean {
  return readIntentShellEnv()
}

export function loadIntentShellPreference(): boolean {
  if (!isIntentShellFeatureEnabled()) return false
  try {
    const raw = localStorage.getItem(INTENT_SHELL_LS)
    if (raw === 'false') return false
    if (raw === 'true') return true
  } catch {
    // ignore
  }
  return true
}

export function saveIntentShellPreference(enabled: boolean): void {
  try {
    localStorage.setItem(INTENT_SHELL_LS, String(enabled))
  } catch {
    // ignore
  }
}

export function shouldShowIntentShell(files: FileItem[], enabled: boolean): boolean {
  if (!isIntentShellFeatureEnabled() || !enabled) return false
  return buildSpecStatusSummary(files).specCount > 0
}
