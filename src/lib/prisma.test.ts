import { describe, expect, it } from 'vitest'
import { shouldUseNeonAdapter } from './prisma'

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
