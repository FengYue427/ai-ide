import { describe, expect, it } from 'vitest'
import {
  GIT_DIFF_MAX_BYTES_PER_SIDE,
  GIT_DIFF_MAX_LINES_PER_SIDE,
  prepareGitDiffForEditor,
  shouldTruncateGitDiff,
  truncateGitDiffSide,
} from './gitDiffContentLimits'

describe('truncateGitDiffSide', () => {
  it('passes through small content unchanged', () => {
    const result = truncateGitDiffSide('a\nb\nc')
    expect(result.truncated).toBe(false)
    expect(result.content).toBe('a\nb\nc')
    expect(result.totalLines).toBe(3)
  })

  it('truncates when line count exceeds cap', () => {
    const content = Array.from({ length: GIT_DIFF_MAX_LINES_PER_SIDE + 50 }, (_, i) => `line ${i}`).join('\n')
    const result = truncateGitDiffSide(content)
    expect(result.truncated).toBe(true)
    expect(result.shownLines).toBe(GIT_DIFF_MAX_LINES_PER_SIDE)
    expect(result.totalLines).toBe(GIT_DIFF_MAX_LINES_PER_SIDE + 50)
  })

  it('truncates when byte size exceeds cap', () => {
    const content = 'x'.repeat(GIT_DIFF_MAX_BYTES_PER_SIDE + 1000)
    const result = truncateGitDiffSide(content)
    expect(result.truncated).toBe(true)
    expect(result.content.length).toBeLessThanOrEqual(GIT_DIFF_MAX_BYTES_PER_SIDE)
  })
})

describe('prepareGitDiffForEditor', () => {
  it('marks truncated when either side is large', () => {
    const huge = `${'line\n'.repeat(GIT_DIFF_MAX_LINES_PER_SIDE + 10)}`
    const prepared = prepareGitDiffForEditor('small', huge)
    expect(prepared.truncated).toBe(true)
    expect(prepared.originalNewLines).toBeGreaterThan(GIT_DIFF_MAX_LINES_PER_SIDE)
    expect(prepared.shownNewLines).toBe(GIT_DIFF_MAX_LINES_PER_SIDE)
  })

  it('keeps both sides when under caps', () => {
    const prepared = prepareGitDiffForEditor('old', 'new')
    expect(prepared.truncated).toBe(false)
    expect(prepared.oldContent).toBe('old')
    expect(prepared.newContent).toBe('new')
  })
})

describe('shouldTruncateGitDiff', () => {
  it('detects oversized sides', () => {
    expect(shouldTruncateGitDiff('a', 'b')).toBe(false)
    expect(shouldTruncateGitDiff('x'.repeat(GIT_DIFF_MAX_BYTES_PER_SIDE + 1), 'b')).toBe(true)
  })
})
