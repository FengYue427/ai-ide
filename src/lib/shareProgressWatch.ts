/**
 * Phase 7.3 — local watch list for share progress updates (pre-email stub).
 */
const WATCH_KEY = 'aide:share-progress-watch'

export interface ShareProgressWatchEntry {
  shareId: string
  label: string
  subscribedAt: string
  lastSeenAt: string
  /** Digest at last visit — used to detect local "has update" badge. */
  lastSeenDigest?: string
}

function readWatchList(): ShareProgressWatchEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(WATCH_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShareProgressWatchEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeWatchList(entries: ShareProgressWatchEntry[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(WATCH_KEY, JSON.stringify(entries.slice(-20)))
}

export function listShareProgressWatch(): ShareProgressWatchEntry[] {
  return readWatchList()
}

export function isShareProgressWatched(shareId: string): boolean {
  return readWatchList().some((entry) => entry.shareId === shareId)
}

export function subscribeShareProgressWatch(shareId: string, label: string, digest?: string): void {
  const list = readWatchList().filter((entry) => entry.shareId !== shareId)
  const now = new Date().toISOString()
  list.push({
    shareId,
    label,
    subscribedAt: now,
    lastSeenAt: now,
    lastSeenDigest: digest,
  })
  writeWatchList(list)
}

export function unsubscribeShareProgressWatch(shareId: string): void {
  writeWatchList(readWatchList().filter((entry) => entry.shareId !== shareId))
}

export function markShareProgressSeen(shareId: string, digest?: string): void {
  writeWatchList(
    readWatchList().map((entry) =>
      entry.shareId === shareId
        ? {
            ...entry,
            lastSeenAt: new Date().toISOString(),
            lastSeenDigest: digest ?? entry.lastSeenDigest,
          }
        : entry,
    ),
  )
}

export function hasShareProgressUpdate(shareId: string, currentDigest: string): boolean {
  const entry = readWatchList().find((item) => item.shareId === shareId)
  if (!entry?.lastSeenDigest) return false
  return entry.lastSeenDigest !== currentDigest
}
