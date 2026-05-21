/**
 * Verify DATABASE_URL connectivity (Prisma)
 * Usage: node scripts/check-db.mjs
 */
import { loadEnvLocal } from './load-env-local.mjs'

loadEnvLocal()

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌ DATABASE_URL not set in .env.local')
  console.error('   Neon: https://console.neon.tech → Connect → paste into .env.local')
  console.error('   See docs/NEON_SETUP.md')
  process.exit(1)
}

if (url.includes('PASTE_YOUR_NEON') || url.includes('ep-xxxx')) {
  console.error('❌ DATABASE_URL is still a placeholder — paste your Neon connection string')
  console.error('   See docs/NEON_SETUP.md')
  process.exit(1)
}

console.log('Checking:', url.replace(/:[^:@/]+@/, ':****@'))

try {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  await prisma.$queryRaw`SELECT 1`
  await prisma.$disconnect()
  console.log('✅ Database connection OK')
  process.exit(0)
} catch (error) {
  console.error('❌ Database connection failed:', error instanceof Error ? error.message : error)
  console.error('\nTips:')
  console.error('  1. Start Docker Desktop')
  console.error('  2. npm run db:up')
  console.error('  3. npm run db:push')
  process.exit(1)
}
