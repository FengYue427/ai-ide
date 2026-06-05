import { describe, expect, it } from 'vitest'
import { MIN_TAB_PREFIX_CHARS, shouldSkipTabCompletionRequest } from './tabCompletionRequestGate'

describe('shouldSkipTabCompletionRequest', () => {
  it('skips empty or whitespace-only prefix', () => {
    expect(shouldSkipTabCompletionRequest('')).toBe(true)
    expect(shouldSkipTabCompletionRequest('   \n')).toBe(true)
  })

  it('skips when current line has fewer than MIN chars', () => {
    expect(shouldSkipTabCompletionRequest('ab')).toBe(true)
    expect(shouldSkipTabCompletionRequest('function foo() {\n  x')).toBe(true)
  })

  it('allows when current line has enough content', () => {
    const ok = 'x'.repeat(MIN_TAB_PREFIX_CHARS)
    expect(shouldSkipTabCompletionRequest(ok)).toBe(false)
    expect(shouldSkipTabCompletionRequest(`function run() {\n  ${ok}`)).toBe(false)
  })
})
