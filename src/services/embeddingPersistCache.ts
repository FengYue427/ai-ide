/**
 * v1.3 F2 — persist semantic embedding chunk vectors (IndexedDB) with TTL.
 */

import {
  recordEmbeddingPersistExpired,
  recordEmbeddingPersistHit,
  recordEmbeddingPersistMiss,
} from '../lib/embeddingPersistMetrics'
import { unifiedStorage, StorageLayer } from './unifiedStorage'

export {
  getEmbeddingPersistMetrics,
  resetEmbeddingPersistMetrics,
  type EmbeddingPersistMetricsSnapshot,
} from '../lib/embeddingPersistMetrics'

const TTL_MS = 7 * 24 * 60 * 60 * 1000
const KEY_PREFIX = 'embedding-cache:v1:'

export interface PersistedChunkVector {
  path: string
  text: string
  vector: number[]
}

interface PersistedEntry {
  savedAt: number
  records: PersistedChunkVector[]
}

function storageKey(cacheKey: string): string {
  return `${KEY_PREFIX}${cacheKey}`
}

export async function loadPersistedChunkVectors(
  cacheKey: string,
): Promise<PersistedChunkVector[] | null> {
  const entry = await unifiedStorage.get<PersistedEntry | null>(storageKey(cacheKey), null, {
    preferredLayer: StorageLayer.INDEXED,
  })
  if (!entry?.records?.length) {
    recordEmbeddingPersistMiss()
    return null
  }
  if (Date.now() - entry.savedAt > TTL_MS) {
    await unifiedStorage.remove(storageKey(cacheKey))
    recordEmbeddingPersistExpired()
    return null
  }
  recordEmbeddingPersistHit()
  return entry.records
}

export async function savePersistedChunkVectors(
  cacheKey: string,
  records: PersistedChunkVector[],
): Promise<void> {
  if (!records.length) return
  await unifiedStorage.set(
    storageKey(cacheKey),
    { savedAt: Date.now(), records },
    { layer: StorageLayer.INDEXED },
  )
}

