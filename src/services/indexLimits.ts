/** Shared caps for project index, @-search, text search, and semantic retrieval. */

export const MAX_INDEX_FILES = 200
export const MAX_INDEX_FILE_BYTES = 120_000
export const MAX_INDEX_TOTAL_BYTES = 2_000_000

export type IndexSource = { path: string; content: string; language?: string }

/** Prefer recently listed sources; skip oversized files. */
export function capIndexSources(sources: IndexSource[]): IndexSource[] {
  const capped: IndexSource[] = []
  let totalBytes = 0

  for (const source of sources) {
    if (capped.length >= MAX_INDEX_FILES) break
    const bytes = source.content.length
    if (bytes > MAX_INDEX_FILE_BYTES) continue
    if (totalBytes + bytes > MAX_INDEX_TOTAL_BYTES) break
    totalBytes += bytes
    capped.push(source)
  }

  return capped
}
