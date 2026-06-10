/**
 * Production DB migrations during Vercel build.
 *
 * - Skips when DATABASE_URL is unset (local build without DB).
 * - Ensures CollaborationRoom / CollaborationMember exist (Neon-safe checks).
 * - On P3005 (db push history), baselines prior migrations then deploys collab.
 * - Falls back to `prisma db execute` if migrate deploy did not create collab tables.
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
const COLLAB_MIGRATION_FILE = join(
  root,
  'prisma/migrations/20260529120000_collab_rooms/migration.sql',
)

/** Migrations already reflected in production via historical `db push`. */
const BASELINE_MIGRATIONS = ['20260520120000_init', '20260529120000_background_jobs']

function sanitizeDbUrl(raw) {
  return raw.replace(/[&?]channel_binding=[^&]*/gi, '').replace(/\?&/, '?').replace(/&&/g, '&')
}

function maskUrl(raw) {
  return raw.replace(/:[^:@/]+@/, ':****@')
}

function runPrisma(args) {
  return spawnSync('npx', ['prisma', ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    stdio: 'pipe',
  })
}

function emitCaptured(result) {
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
}

async function collaborationRoomExists() {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(sanitizeDbUrl(url))
  const rows = await sql`
    SELECT to_regclass('public."CollaborationRoom"') IS NOT NULL AS "exists"
  `
  return Boolean(rows[0]?.exists)
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
  }
}

function applyCollabSqlFallback() {
  console.log('[migrate-if-db] Applying collab migration SQL via prisma db execute …')
  const result = runPrisma([
    'db',
    'execute',
    '--file',
    COLLAB_MIGRATION_FILE,
    '--schema',
    join(root, 'prisma/schema.prisma'),
  ])
  emitCaptured(result)
  return result
}

console.log('[migrate-if-db] Target:', maskUrl(url))

try {
  if (await collaborationRoomExists()) {
    console.log('[migrate-if-db] CollaborationRoom exists — applying pending migrations')
    const pending = runMigrateDeploy()
    if (pending.status !== 0) {
      console.error('[migrate-if-db] migrate deploy failed on existing database')
      process.exit(pending.status ?? 1)
    }
    console.log('[migrate-if-db] Pending migrations applied')
    process.exit(0)
  }

  let result = runMigrateDeploy()
  if (result.status !== 0 && isP3005(result)) {
    baselinePriorMigrations()
    result = runMigrateDeploy()
  }

  if (result.status !== 0) {
    console.warn('[migrate-if-db] migrate deploy failed — trying SQL fallback')
    const fallback = applyCollabSqlFallback()
    if (fallback.status !== 0) {
      console.error('[migrate-if-db] SQL fallback failed')
      process.exit(fallback.status ?? 1)
    }
  }

  if (!(await collaborationRoomExists())) {
    console.log('[migrate-if-db] Collab tables still missing after migrate — SQL fallback')
    const fallback = applyCollabSqlFallback()
    if (fallback.status !== 0 || !(await collaborationRoomExists())) {
      console.error('[migrate-if-db] CollaborationRoom still missing after all attempts')
      process.exit(1)
    }
  }

  console.log('[migrate-if-db] CollaborationRoom ready')
  process.exit(0)
} catch (error) {
  console.error('[migrate-if-db] Unexpected error:', error instanceof Error ? error.message : error)
  process.exit(1)
}
