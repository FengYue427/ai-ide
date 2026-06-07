import { afterEach, describe, expect, it, vi } from 'vitest'
import { prismaUpsert, type UpsertDelegate } from './prismaUpsert'

describe('prismaUpsert', () => {
  const prevUrl = process.env.DATABASE_URL

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = prevUrl
    vi.restoreAllMocks()
  })

  it('uses delegate upsert when transactions are supported', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/ai_ide'
    const delegate = {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: '1', plan: { name: 'pro' } }),
    } satisfies UpsertDelegate<{ id: string; plan: { name: string } }>

    const result = await prismaUpsert({
      delegate,
      where: { userId: 'u1' },
      create: { userId: 'u1' },
      update: { status: 'active' },
      include: { plan: true },
    })

    expect(result.plan.name).toBe('pro')
    expect(delegate.upsert).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      create: { userId: 'u1' },
      update: { status: 'active' },
      include: { plan: true },
    })
    expect(delegate.update).not.toHaveBeenCalled()
  })

  it('updates without include on Neon, then reloads with include', async () => {
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-foo-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
    const reloaded = { id: '1', plan: { name: 'enterprise' } }
    const delegate = {
      findUnique: vi
        .fn()
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce(reloaded),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: '1' }),
      upsert: vi.fn(),
    } satisfies UpsertDelegate<{ id: string; plan: { name: string } }>

    const result = await prismaUpsert({
      delegate,
      where: { userId: 'u1' },
      create: { userId: 'u1', planId: 'p1' },
      update: { planId: 'p2' },
      include: { plan: true },
    })

    expect(result).toEqual(reloaded)
    expect(delegate.update).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      data: { planId: 'p2' },
    })
    expect(delegate.findUnique).toHaveBeenLastCalledWith({
      where: { userId: 'u1' },
      include: { plan: true },
    })
  })
})
