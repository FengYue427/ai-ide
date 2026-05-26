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
})
