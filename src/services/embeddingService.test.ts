import { describe, expect, it } from 'vitest'
import { canUseEmbeddings, cosineSimilarity } from './embeddingService'

describe('embeddingService', () => {
  it('cosineSimilarity ranks closer vectors higher', () => {
    const a = [1, 0, 0]
    const b = [1, 0, 0]
    const c = [0, 1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(1)
    expect(cosineSimilarity(a, c)).toBeCloseTo(0)
  })

  it('canUseEmbeddings requires api key and disallows ollama', () => {
    expect(canUseEmbeddings({ provider: 'openai', apiKey: 'sk-test' })).toBe(true)
    expect(canUseEmbeddings({ provider: 'ollama', apiKey: '' })).toBe(false)
    expect(canUseEmbeddings({ provider: 'openai', apiKey: '' })).toBe(false)
  })
})
