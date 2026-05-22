import { prismaSupportsTransactions } from '../../src/lib/prismaTransactions'

export type UpsertDelegate<T> = {
  findUnique: (args: { where: unknown }) => Promise<T | null>
  create: (args: { data: unknown; include?: unknown }) => Promise<T>
  update: (args: { where: unknown; data: unknown; include?: unknown }) => Promise<T>
  upsert: (args: {
    where: unknown
    create: unknown
    update: unknown
    include?: unknown
  }) => Promise<T>
}

/** Neon HTTP has no `$transaction`; Prisma `upsert` may still require one. */
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
    return args.delegate.update({
      where: args.where,
      data: args.update,
      include: args.include,
    })
  }
  return args.delegate.create({
    data: args.create,
    include: args.include,
  })
}

export { prisma } from '../../src/lib/prisma'
