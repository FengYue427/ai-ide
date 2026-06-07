/**
 * Show Prisma migration status using DATABASE_URL from .env.local.
 * Usage: npm run db:migrate:status
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocalOrExit } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

loadEnvLocalOrExit()

const result = spawnSync('npx', ['prisma', 'migrate', 'status'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
