import { describe, expect, it } from 'vitest'
import { MAX_TOOL_OUTPUT } from './executor'

describe('MAX_TOOL_OUTPUT', () => {
  it('is exported for agent docs and tests', () => {
    expect(MAX_TOOL_OUTPUT).toBeGreaterThan(10_000)
  })
})
