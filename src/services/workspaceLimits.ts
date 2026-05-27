/**
 * Unified workspace / index file caps for UI and validation.
 */
import { isDesktopApp } from './desktopBridge'
import { getMaxIndexFiles, MAX_INDEX_FILES, MAX_INDEX_FILES_DESKTOP } from './indexLimits'

export { getMaxIndexFiles, MAX_INDEX_FILES, MAX_INDEX_FILES_DESKTOP }

export type WorkspaceLimitTier = 'ok' | 'warn' | 'full'

export type WorkspaceLimitSnapshot = {
  current: number
  max: number
  tier: WorkspaceLimitTier
  isDesktop: boolean
  percent: number
}

const WARN_RATIO = 0.85

export function getWorkspaceFileLimit(): number {
  return getMaxIndexFiles()
}

export function getWorkspaceLimitSnapshot(fileCount: number): WorkspaceLimitSnapshot {
  const max = getWorkspaceFileLimit()
  const current = Math.max(0, fileCount)
  const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  let tier: WorkspaceLimitTier = 'ok'
  if (current >= max) tier = 'full'
  else if (current >= Math.floor(max * WARN_RATIO)) tier = 'warn'

  return {
    current,
    max,
    tier,
    isDesktop: isDesktopApp(),
    percent,
  }
}

export function isPayloadTooLargeError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('413') ||
    lower.includes('content too large') ||
    lower.includes('payload too large') ||
    lower.includes('request entity too large') ||
    lower.includes('too large')
  )
}
