import { describe, expect, it } from 'vitest'
import { sanitizeDatabaseUrl, shouldUseNeonAdapter } from './dbUrl'

describe('shouldUseNeonAdapter', () => {
  it('uses default driver for local CI postgres', () => {
    expect(
      shouldUseNeonAdapter('postgresql://postgres:postgres@localhost:5432/ai_ide'),
    ).toBe(false)
  })

  it('uses neon driver for neon.tech hosts', () => {
    expect(
      shouldUseNeonAdapter(
        'postgresql://user:pass@ep-abc-123.us-east-2.aws.neon.tech/neondb?sslmode=require',
      ),
    ).toBe(true)
  })
})

describe('sanitizeDatabaseUrl', () => {
  it('removes channel_binding query param', () => {
    const url =
      'postgresql://u:p@ep-x.aws.neon.tech/db?sslmode=require&channel_binding=require'
    expect(sanitizeDatabaseUrl(url)).not.toContain('channel_binding')
    expect(sanitizeDatabaseUrl(url)).toContain('sslmode=require')
  })
})
