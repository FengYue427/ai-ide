import { prismaSupportsTransactions } from '../../src/lib/prismaTransactions'

export type UpsertDelegate<T> = {
  findUnique: (args: { where: unknown; include?: unknown }) => Promise<T | null>
  create: (args: { data: unknown; include?: unknown }) => Promise<T>
  update: (args: { where: unknown; data: unknown; include?: unknown }) => Promise<T>
  upsert: (args: {
    where: unknown
    create: unknown
    update: unknown
    include?: unknown
  }) => Promise<T>
}

async function reloadWithInclude<T>(
  delegate: UpsertDelegate<T>,
  where: unknown,
  include: unknown,
): Promise<T> {
  const row = await delegate.findUnique({ where, include })
  if (!row) {
    throw new Error('prismaUpsert: row missing after write')
  }
  return row
}

/** Neon HTTP has no `$transaction`; avoid `upsert` and `update({ include })` on serverless driver. */
export async function prismaUpsert<T>(args: {
  delegate: UpsertDelegate<T>
  where: unknown
  create: unknown
  update: unknown
  include?: unknown
}): Promise<T> {
  if (prismaSupportsTransactions()) {
    return args.delegate.upsert({
      where: args.where,
      create: args.create,
      update: args.update,
      include: args.include,
    })
  }

  const existing = await args.delegate.findUnique({ where: args.where })
  if (existing) {
    await args.delegate.update({
      where: args.where,
      data: args.update,
    })
    if (args.include) {
      return reloadWithInclude(args.delegate, args.where, args.include)
    }
    const row = await args.delegate.findUnique({ where: args.where })
    if (!row) {
      throw new Error('prismaUpsert: row missing after update')
    }
    return row
  }
  try {
    await args.delegate.create({
      data: args.create,
    })
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      await args.delegate.update({
        where: args.where,
        data: args.update,
      })
    } else {
      throw error
    }
  }

  if (args.include) {
    return reloadWithInclude(args.delegate, args.where, args.include)
  }
  const row = await args.delegate.findUnique({ where: args.where })
  if (!row) {
    throw new Error('prismaUpsert: row missing after create')
  }
  return row
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

export { prisma } from '../../src/lib/prisma'
