import { describe, expect, it, beforeEach } from 'vitest'
import {
  getEmbeddingPersistMetrics,
  recordEmbeddingPersistExpired,
  recordEmbeddingPersistHit,
  recordEmbeddingPersistMiss,
  resetEmbeddingPersistMetrics,
} from './embeddingPersistMetrics'

describe('embeddingPersistMetrics', () => {
  beforeEach(() => {
    resetEmbeddingPersistMetrics()
  })

  it('tracks hit miss expired', () => {
    recordEmbeddingPersistHit()
    recordEmbeddingPersistMiss()
    recordEmbeddingPersistExpired()
    const m = getEmbeddingPersistMetrics()
    expect(m.hits).toBe(1)
    expect(m.misses).toBe(1)
    expect(m.expired).toBe(1)
  })
})
