/**
 * Run `prisma migrate deploy` when DATABASE_URL is set (Vercel Production build).
 * Skips silently in local/CI builds without a database.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './load-env-local.mjs'

loadEnvLocal()

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.log('[migrate-if-db] DATABASE_URL unset — skipping prisma migrate deploy')
  process.exit(0)
}

if (url.includes('PASTE_YOUR_NEON') || url.includes('ep-xxxx')) {
  console.log('[migrate-if-db] DATABASE_URL is placeholder — skipping migrate deploy')
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
console.log('[migrate-if-db] Running prisma migrate deploy …')
console.log('[migrate-if-db] Target:', url.replace(/:[^:@/]+@/, ':****@'))

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
