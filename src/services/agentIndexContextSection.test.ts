import { describe, expect, it } from 'vitest'
import { buildAgentIndexContextSection } from './agentIndexContextSection'

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
  })
})
