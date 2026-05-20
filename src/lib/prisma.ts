import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Neon serverless URLs need the WebSocket driver on Vercel. Standard Postgres uses the default engine. */
export function shouldUseNeonAdapter(connectionString: string): boolean {
  if (process.env.USE_NEON_DRIVER === 'true') return true
  if (process.env.USE_NEON_DRIVER === 'false') return false
  return /neon\.tech/i.test(connectionString)
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  if (shouldUseNeonAdapter(connectionString)) {
    neonConfig.webSocketConstructor = ws
    const adapter = new PrismaNeon({ connectionString })
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

/** Lazy Prisma client — Neon adapter on Neon URLs; default driver for local/CI Postgres. */
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
