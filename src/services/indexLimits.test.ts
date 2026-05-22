import { describe, expect, it } from 'vitest'
import { capIndexSources, MAX_INDEX_FILES, MAX_INDEX_FILE_BYTES } from './indexLimits'

describe('indexLimits', () => {
  it('caps file count and skips oversized files', () => {
    const sources = Array.from({ length: MAX_INDEX_FILES + 5 }, (_, i) => ({
      path: `f${i}.ts`,
      content: 'x',
    }))
    sources.push({ path: 'huge.ts', content: 'x'.repeat(MAX_INDEX_FILE_BYTES + 1) })

    const capped = capIndexSources(sources)
    expect(capped).toHaveLength(MAX_INDEX_FILES)
    expect(capped.some((f) => f.path === 'huge.ts')).toBe(false)
  })
})
