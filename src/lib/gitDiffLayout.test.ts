import { describe, expect, it } from 'vitest'
import { resolveGitDiffRenderLayout } from './gitDiffLayout'

describe('resolveGitDiffRenderLayout', () => {
  it('uses side-by-side for small diffs', () => {
    expect(resolveGitDiffRenderLayout('a\nb', 'a\nc')).toBe('sideBySide')
  })

  it('uses inline for large line counts', () => {
    const large = `${'line\n'.repeat(600)}`
    expect(resolveGitDiffRenderLayout('small', large)).toBe('inline')
  })

  it('uses inline for large byte size', () => {
    const blob = 'x'.repeat(150_000)
    expect(resolveGitDiffRenderLayout(blob, 'y')).toBe('inline')
  })
})
