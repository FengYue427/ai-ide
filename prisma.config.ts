import type { PrismaConfig } from 'prisma'

export default {
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')
      const connectionString = process.env.DATABASE_URL
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set')
      }
      const pool = new Pool({ connectionString })
      return new PrismaPg(pool)
    },
  },
} satisfies PrismaConfig
