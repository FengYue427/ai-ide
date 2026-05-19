import { describe, expect, it } from 'vitest'
import {
  applyPartialDiff,
  computeLineDiff,
  defaultAcceptedHunks,
  groupDiffHunks,
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

  it('applyPartialDiff supports insert-only hunks', () => {
    const oldContent = 'line1'
    const newContent = 'line1\nline2'
    const diff = computeLineDiff(oldContent, newContent)
    const accepted = defaultAcceptedHunks(diff)

    expect(applyPartialDiff(oldContent, diff, accepted)).toBe(newContent)
  })
})
