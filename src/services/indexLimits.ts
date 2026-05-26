/** Shared caps for project index, @-search, text search, and semantic retrieval. */

import { isDesktopApp } from './desktopBridge'

/** Browser / FS Access workspace (v1.0.2.4). */
export const MAX_INDEX_FILES = 500
/** Electron desktop scan (v1.0.2.4). */
export const MAX_INDEX_FILES_DESKTOP = 2000

const LIMIT_OVERRIDE_KEY = 'ai-ide:index-max-files-override'

export function getMaxIndexFiles(): number {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(LIMIT_OVERRIDE_KEY)
    const parsed = raw ? Number.parseInt(raw, 10) : NaN
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }
  return isDesktopApp() ? MAX_INDEX_FILES_DESKTOP : MAX_INDEX_FILES
}

export function setIndexMaxFilesOverride(value: number | null): void {
  if (typeof localStorage === 'undefined') return
  if (value == null || !Number.isFinite(value) || value <= 0) {
    localStorage.removeItem(LIMIT_OVERRIDE_KEY)
    return
  }
  localStorage.setItem(LIMIT_OVERRIDE_KEY, String(Math.floor(value)))
}

export const MAX_INDEX_FILE_BYTES = 120_000
export const MAX_INDEX_TOTAL_BYTES = 4_000_000

export type IndexSource = { path: string; content: string; language?: string }

/** Prefer recently listed sources; skip oversized files. */
export function capIndexSources(sources: IndexSource[], maxFiles?: number): IndexSource[] {
  const limit = maxFiles ?? getMaxIndexFiles()
  const capped: IndexSource[] = []
  let totalBytes = 0

  for (const source of sources) {
    if (capped.length >= limit) break
    const bytes = source.content.length
    if (bytes > MAX_INDEX_FILE_BYTES) continue
    if (totalBytes + bytes > MAX_INDEX_TOTAL_BYTES) break
    totalBytes += bytes
    capped.push(source)
  }

  return capped
}
