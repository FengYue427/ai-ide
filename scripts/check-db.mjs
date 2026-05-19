/**
 * Verify DATABASE_URL connectivity (Prisma)
 * Usage: node scripts/check-db.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

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
