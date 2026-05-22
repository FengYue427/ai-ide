import { afterEach, describe, expect, it } from 'vitest'
import { prismaSupportsTransactions } from './prismaTransactions'

describe('prismaSupportsTransactions', () => {
  const prev = process.env.DATABASE_URL

  afterEach(() => {
    if (prev === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = prev
  })

  it('returns false for Neon pooler URLs', () => {
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-foo-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
    expect(prismaSupportsTransactions()).toBe(false)
  })

  it('returns true for local Postgres', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/ai_ide'
    expect(prismaSupportsTransactions()).toBe(true)
  })
})
