import { PrismaNeonHTTP } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import { sanitizeDatabaseUrl, shouldUseNeonAdapter } from './dbUrl'

export { sanitizeDatabaseUrl, shouldUseNeonAdapter } from './dbUrl'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  if (shouldUseNeonAdapter(connectionString)) {
    const adapter = new PrismaNeonHTTP(sanitizeDatabaseUrl(connectionString), {})
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

/** Lazy Prisma client — Neon HTTP on Neon URLs; default driver for local/CI Postgres. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, client)
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
})
