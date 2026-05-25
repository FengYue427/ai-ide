import { describe, expect, it } from 'vitest'
import { normalizePemKey } from './pemKey'

const SAMPLE_BODY = 'MIIE'.repeat(40)

describe('normalizePemKey', () => {
  it('wraps raw base64', () => {
    const out = normalizePemKey(SAMPLE_BODY, 'RSA PRIVATE KEY')
    expect(out).toContain('-----BEGIN RSA PRIVATE KEY-----')
    expect(out).toContain('-----END RSA PRIVATE KEY-----')
  })

  it('handles escaped newlines in env', () => {
    const inline = `-----BEGIN RSA PRIVATE KEY-----\\n${SAMPLE_BODY}\\n-----END RSA PRIVATE KEY-----`
    const out = normalizePemKey(inline, 'RSA PRIVATE KEY')
    expect(out.split('\n').length).toBeGreaterThan(3)
  })

  it('rejects header-only key (multiline .env truncated)', () => {
    expect(() => normalizePemKey('-----BEGIN RSA PRIVATE KEY-----', 'RSA PRIVATE KEY')).toThrow(
      /过短|无效/,
    )
  })
})
