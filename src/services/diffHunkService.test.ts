import { describe, expect, it } from 'vitest'
import {
  applyPartialDiff,
  computeLineDiff,
  countDiffHunks,
  defaultAcceptedHunks,
  groupDiffHunks,
  mergeAgentFileContent,
} from './diffHunkService'

describe('diffHunkService', () => {
  it('groups change lines into hunks', () => {
    const diff = computeLineDiff('a\nb\nc', 'a\nB\nc')
    expect(groupDiffHunks(diff)).toHaveLength(1)
  })

  it('applyPartialDiff keeps rejected hunks', () => {
    const oldContent = 'alpha\nbeta\ngamma'
    const newContent = 'alpha\nBETA\ngamma'
    const diff = computeLineDiff(oldContent, newContent)
    const accepted = new Set<number>()

    expect(applyPartialDiff(oldContent, diff, accepted)).toBe(oldContent)
  })

  it('applyPartialDiff applies accepted hunks', () => {
    const oldContent = 'alpha\nbeta\ngamma'
    const newContent = 'alpha\nBETA\ngamma'
    const diff = computeLineDiff(oldContent, newContent)
    const accepted = defaultAcceptedHunks(diff)

    expect(applyPartialDiff(oldContent, diff, accepted)).toBe(newContent)
  })

  it('countDiffHunks returns grouped change regions', () => {
    expect(countDiffHunks('a\nb', 'a\nB')).toBe(1)
    expect(countDiffHunks('same', 'same')).toBe(0)
  })

  it('mergeAgentFileContent uses partial selection', () => {
    const oldContent = 'keep\nold'
    const newContent = 'keep\nnew'
    const diff = computeLineDiff(oldContent, newContent)
    expect(mergeAgentFileContent(oldContent, newContent, new Set())).toBe(oldContent)
    expect(mergeAgentFileContent(oldContent, newContent, defaultAcceptedHunks(diff))).toBe(newContent)
  })

  it('applyPartialDiff supports insert-only hunks', () => {
    const oldContent = 'line1'
    const newContent = 'line1\nline2'
    const diff = computeLineDiff(oldContent, newContent)
    const accepted = defaultAcceptedHunks(diff)

    expect(applyPartialDiff(oldContent, diff, accepted)).toBe(newContent)
  })

  // ─── LCS 精准 diff 新增测试 ───────────────────────────────────────────────

  it('LCS: correctly identifies moved lines', () => {
    // LCS 能识别 b 行保持不变，只有 a→A 发生变化
    const diff = computeLineDiff('a\nb\nc', 'A\nb\nc')
    const unchanged = diff.filter(l => l.type === 'unchanged').map(l => l.content)
    expect(unchanged).toContain('b')
    expect(unchanged).toContain('c')
    const removed = diff.filter(l => l.type === 'removed').map(l => l.content)
    expect(removed).toContain('a')
    const added = diff.filter(l => l.type === 'added').map(l => l.content)
    expect(added).toContain('A')
  })

  it('LCS: handles identical content', () => {
    const content = 'line1\nline2\nline3'
    const diff = computeLineDiff(content, content)
    expect(diff.every(l => l.type === 'unchanged')).toBe(true)
    expect(countDiffHunks(content, content)).toBe(0)
  })

  it('LCS: handles empty old content', () => {
    // '' split('\n') = [''] — 一个空行，所以 diff 是 removed 空行 + added 'new line'
    const diff = computeLineDiff('', 'new line')
    expect(diff.filter(l => l.type === 'added').map(l => l.content)).toContain('new line')
    expect(diff.filter(l => l.type === 'removed').map(l => l.content)).not.toContain('new line')
  })

  it('LCS: handles empty new content', () => {
    const diff = computeLineDiff('old line', '')
    expect(diff.filter(l => l.type === 'removed').map(l => l.content)).toContain('old line')
    expect(diff.filter(l => l.type === 'added').map(l => l.content)).not.toContain('old line')
  })

  it('LCS: multiple independent hunks', () => {
    const old = 'a\nb\nc\nd\ne'
    const nw  = 'A\nb\nC\nd\nE'
    expect(countDiffHunks(old, nw)).toBe(3)
    const diff = computeLineDiff(old, nw)
    const unchanged = diff.filter(l => l.type === 'unchanged').map(l => l.content)
    expect(unchanged).toContain('b')
    expect(unchanged).toContain('d')
  })

  it('LCS: partial apply selects specific hunks', () => {
    const old = 'a\nb\nc\nd\ne'
    const nw  = 'A\nb\nC\nd\nE'
    const diff = computeLineDiff(old, nw)
    const hunks = groupDiffHunks(diff)
    expect(hunks).toHaveLength(3)

    // 只接受第 0 和第 2 个 hunk（a→A 和 e→E），跳过第 1 个（c→C）
    const partial = applyPartialDiff(old, diff, new Set([0, 2]))
    expect(partial).toBe('A\nb\nc\nd\nE')
  })

  it('LCS: line numbers are correct', () => {
    const diff = computeLineDiff('a\nb\nc', 'a\nB\nc')
    const removed = diff.find(l => l.type === 'removed')
    const added = diff.find(l => l.type === 'added')
    expect(removed?.oldLineNumber).toBe(2)
    expect(added?.newLineNumber).toBe(2)
  })
})
