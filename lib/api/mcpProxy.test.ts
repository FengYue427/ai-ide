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

  it('rejects private IPs in production', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      expect(() => validateMcpProxyUrl('http://192.168.1.1/mcp')).toThrow()
      expect(() => validateMcpProxyUrl('http://10.0.0.1/mcp')).toThrow()
    } finally {
      process.env.NODE_ENV = prev
    }
  })
})
