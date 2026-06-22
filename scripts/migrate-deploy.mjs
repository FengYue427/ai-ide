/**
 * Deploy Prisma migrations using DATABASE_URL from .env.local.
 * Usage: npm run db:migrate:deploy
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvForDbOrExit } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

loadEnvForDbOrExit()

console.log('=== prisma migrate deploy ===')
console.log('Target:', process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':****@'))

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
