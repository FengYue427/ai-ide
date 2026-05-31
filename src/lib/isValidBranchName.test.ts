import { describe, expect, it } from 'vitest'
import { isValidBranchName } from './isValidBranchName'

describe('isValidBranchName', () => {
  it('accepts common branch names', () => {
    expect(isValidBranchName('main')).toBe(true)
    expect(isValidBranchName('feature/login')).toBe(true)
    expect(isValidBranchName('release-1.2.3')).toBe(true)
  })

  it('rejects invalid branch names', () => {
    expect(isValidBranchName('')).toBe(false)
    expect(isValidBranchName('bad name')).toBe(false)
    expect(isValidBranchName('bad..branch')).toBe(false)
    expect(isValidBranchName('.hidden')).toBe(false)
  })
})
