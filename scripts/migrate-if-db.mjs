/**
 * Production DB migrations during Vercel build.
 *
 * - Skips when DATABASE_URL is unset (local build without DB).
 * - Skips when CollaborationRoom already exists.
 * - On P3005 (db was created via db push), baselines prior migrations then deploys collab.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './load-env-local.mjs'

loadEnvLocal()

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.log('[migrate-if-db] DATABASE_URL unset — skipping')
  process.exit(0)
}

if (url.includes('PASTE_YOUR_NEON') || url.includes('ep-xxxx')) {
  console.log('[migrate-if-db] DATABASE_URL is placeholder — skipping')
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Migrations already reflected in production via historical `db push`. */
const BASELINE_MIGRATIONS = ['20260520120000_init', '20260529120000_background_jobs']

function maskUrl(raw) {
  return raw.replace(/:[^:@/]+@/, ':****@')
}

function runPrisma(args, { inherit = false } = {}) {
  return spawnSync('npx', ['prisma', ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    stdio: inherit ? 'inherit' : 'pipe',
  })
}

function emitCaptured(result) {
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
}

function runMigrateDeploy() {
  console.log('[migrate-if-db] Running prisma migrate deploy …')
  const result = runPrisma(['migrate', 'deploy'])
  emitCaptured(result)
  return result
}

function isP3005(result) {
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return text.includes('P3005') || text.includes('database schema is not empty')
}

function baselinePriorMigrations() {
  console.log('[migrate-if-db] Baselining prior migrations for db-push production DB …')
  for (const migration of BASELINE_MIGRATIONS) {
    const resolved = runPrisma(['migrate', 'resolve', '--applied', migration])
    emitCaptured(resolved)
    if (resolved.status !== 0) {
      const msg = `${resolved.stdout ?? ''}${resolved.stderr ?? ''}`
      if (!msg.includes('already recorded')) {
        console.warn(`[migrate-if-db] resolve --applied ${migration} returned ${resolved.status} (continuing)`)
      }
    }
  }
}

async function collaborationRoomExists() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.$queryRaw`
      SELECT to_regclass('public."CollaborationRoom"') IS NOT NULL AS "exists"
    `
    return Boolean(rows[0]?.exists)
  } finally {
    await prisma.$disconnect()
  }
}

console.log('[migrate-if-db] Target:', maskUrl(url))

try {
  if (await collaborationRoomExists()) {
    console.log('[migrate-if-db] CollaborationRoom already exists — skip migrate deploy')
    process.exit(0)
  }

  let result = runMigrateDeploy()
  if (result.status !== 0 && isP3005(result)) {
    baselinePriorMigrations()
    result = runMigrateDeploy()
  }

  if (result.status !== 0) {
    console.error('[migrate-if-db] migrate deploy failed')
    process.exit(result.status ?? 1)
  }

  console.log('[migrate-if-db] migrate deploy OK')
  process.exit(0)
} catch (error) {
  console.error('[migrate-if-db] Unexpected error:', error instanceof Error ? error.message : error)
  process.exit(1)
}
