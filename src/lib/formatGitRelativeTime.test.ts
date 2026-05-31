import { describe, expect, it } from 'vitest'
import { formatGitRelativeTime } from './formatGitRelativeTime'

describe('formatGitRelativeTime', () => {
  const nowMs = Date.UTC(2026, 4, 29, 12, 0, 0)

  it('formats minutes ago in English', () => {
    const fiveMinAgo = (nowMs - 5 * 60 * 1000) / 1000
    const label = formatGitRelativeTime(fiveMinAgo, 'en-US', nowMs)
    expect(label).toMatch(/5 minutes ago/i)
  })

  it('formats days ago in Chinese', () => {
    const twoDaysAgo = (nowMs - 2 * 86400 * 1000) / 1000
    const label = formatGitRelativeTime(twoDaysAgo, 'zh-CN', nowMs)
    expect(label.length).toBeGreaterThan(0)
  })
})
