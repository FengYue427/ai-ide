import { describe, expect, it } from 'vitest'
import { validateMcpProxyUrl } from './mcpProxy'

describe('validateMcpProxyUrl', () => {
  it('accepts https URLs', () => {
    const url = validateMcpProxyUrl('https://example.com/mcp')
    expect(url.hostname).toBe('example.com')
  })

  it('rejects invalid protocol', () => {
    expect(() => validateMcpProxyUrl('ftp://example.com/mcp')).toThrow()
  })
})
