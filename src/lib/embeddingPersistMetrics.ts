/** v1.3.4 — in-memory counters for embedding IndexedDB cache. */

export interface EmbeddingPersistMetricsSnapshot {
  hits: number
  misses: number
  expired: number
}

const state: EmbeddingPersistMetricsSnapshot = {
  hits: 0,
  misses: 0,
  expired: 0,
}

export function recordEmbeddingPersistHit(): void {
  state.hits += 1
}

export function recordEmbeddingPersistMiss(): void {
  state.misses += 1
}

export function recordEmbeddingPersistExpired(): void {
  state.expired += 1
}

export function getEmbeddingPersistMetrics(): EmbeddingPersistMetricsSnapshot {
  return { ...state }
}

export function resetEmbeddingPersistMetrics(): void {
  state.hits = 0
  state.misses = 0
  state.expired = 0
}
