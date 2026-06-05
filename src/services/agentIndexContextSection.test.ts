import { describe, expect, it } from 'vitest'
import {
  AGENT_INDEX_CONTEXT_MAX_CHARS,
  buildAgentIndexContextSection,
  trimAgentIndexContextSection,
} from './agentIndexContextSection'

describe('buildAgentIndexContextSection', () => {
  it('includes indexed file count', () => {
    const section = buildAgentIndexContextSection('zh-CN', {
      totalFiles: 10,
      eligibleFiles: 8,
      indexedFiles: 5,
      capped: false,
    })
    expect(section).toContain('5')
    expect(section).toContain('项目索引')
    expect(section.length).toBeLessThanOrEqual(AGENT_INDEX_CONTEXT_MAX_CHARS)
  })

  it('trims oversized sections', () => {
    const long = trimAgentIndexContextSection(
      ['## 项目索引', ...Array.from({ length: 80 }, (_, i) => `- line ${i}`)].join('\n'),
      200,
    )
    expect(long.length).toBeLessThanOrEqual(200)
    expect(long).toContain('截断')
  })
})
