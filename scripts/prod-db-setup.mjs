/**
 * Apply Prisma schema + seed plans to the database in DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/prod-db-setup.mjs
 *   USE_PRISMA_MIGRATIONS=true node scripts/prod-db-setup.mjs
 *   node scripts/prod-db-setup.mjs --migrations
 */
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
const useMigrations =
  process.argv.includes('--migrations') || process.env.USE_PRISMA_MIGRATIONS === 'true'

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
    if (!process.env[key]) process.env[key] = val
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('❌ DATABASE_URL is required')
  process.exit(1)
}

console.log('=== Production DB setup ===')
console.log('Target:', process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':****@'))
console.log('Mode:', useMigrations ? 'prisma migrate deploy' : 'prisma db push')

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, env: process.env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npx', ['prisma', 'generate'])
if (useMigrations) {
  run('npx', ['prisma', 'migrate', 'deploy'])
} else {
  run('npx', ['prisma', 'db', 'push'])
}
run('npm', ['run', 'db:seed'])

console.log('\n✅ Database schema and billing plans are ready.')
