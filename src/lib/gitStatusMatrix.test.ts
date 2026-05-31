import { describe, expect, it } from 'vitest'
import { isStagedStatusRow, mapStatusMatrixRow } from './gitStatusMatrix'

describe('mapStatusMatrixRow', () => {
  it('returns null for unmodified rows', () => {
    expect(mapStatusMatrixRow(['d.txt', 1, 1, 1])).toBeNull()
  })

  it('maps untracked files', () => {
    expect(mapStatusMatrixRow(['a.txt', 0, 2, 0])).toEqual({
      filepath: 'a.txt',
      staged: false,
      status: 'untracked',
    })
  })

  it('maps staged added files', () => {
    expect(mapStatusMatrixRow(['b.txt', 0, 2, 2])).toEqual({
      filepath: 'b.txt',
      staged: true,
      status: 'added',
    })
  })

  it('maps unstaged modified files', () => {
    expect(mapStatusMatrixRow(['e.txt', 1, 2, 1])).toEqual({
      filepath: 'e.txt',
      staged: false,
      status: 'modified',
    })
  })

  it('maps staged modified files', () => {
    expect(mapStatusMatrixRow(['f.txt', 1, 2, 2])).toEqual({
      filepath: 'f.txt',
      staged: true,
      status: 'modified',
    })
  })

  it('maps unstaged deleted files', () => {
    expect(mapStatusMatrixRow(['h.txt', 1, 0, 1])).toEqual({
      filepath: 'h.txt',
      staged: false,
      status: 'deleted',
    })
  })

  it('maps staged deleted files', () => {
    expect(mapStatusMatrixRow(['i.txt', 1, 0, 0])).toEqual({
      filepath: 'i.txt',
      staged: true,
      status: 'deleted',
    })
  })
})

describe('isStagedStatusRow', () => {
  it('detects staged vs unstaged from HEAD/STAGE columns', () => {
    expect(isStagedStatusRow(['f.txt', 1, 2, 2])).toBe(true)
    expect(isStagedStatusRow(['e.txt', 1, 2, 1])).toBe(false)
    expect(isStagedStatusRow(['i.txt', 1, 0, 0])).toBe(true)
  })
})
