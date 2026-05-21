import { PrismaNeonHTTP } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Neon serverless URLs use the HTTP driver on Vercel (WebSocket/ws crashes serverless). */
export function shouldUseNeonAdapter(connectionString: string): boolean {
  if (process.env.USE_NEON_DRIVER === 'true') return true
  if (process.env.USE_NEON_DRIVER === 'false') return false
  return /neon\.tech/i.test(connectionString)
}

/** channel_binding breaks some serverless drivers — strip for Neon HTTP. */
export function sanitizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    url.searchParams.delete('channel_binding')
    return url.toString()
  } catch {
    return connectionString.replace(/[&?]channel_binding=[^&]*/gi, '').replace(/\?&/, '?')
  }
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
