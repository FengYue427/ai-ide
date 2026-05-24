/**
 * RC release preflight: unit tests + API route skeleton (+ local .env if present).
 *
 * Usage:
 *   npm run rc:preflight
 *   npm run check:release    # + production env rules
 *   APP_URL=https://your-app.vercel.app npm run deploy:check
 */
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`\n❌ Failed: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.log('=== AI IDE RC preflight ===\n')

run('Typecheck + unit tests', 'npm', ['run', 'test:local'])
run('API bundle (Vercel)', 'npm', ['run', 'build:api'])
run('API route skeleton', 'node', ['scripts/check-skeleton.mjs', '--skip-tests'])

if (existsSync(join(root, '.env.local'))) {
  run('Local env (.env.local)', 'node', ['scripts/verify-env.mjs'])
} else {
  console.log('\nℹ️  No .env.local — skip env verify (copy .env.local.example to enable API tests)')
}

console.log('\n✅ RC preflight passed')
console.log('S0 production gate (env only, no remote smoke): npm run s0:gate')
console.log('Stricter release (local + prod env rules): npm run check:release')
console.log('CN merchants before Path B: npm run check:release:billing')
console.log('After Vercel deploy: APP_URL=https://… npm run deploy:check')
