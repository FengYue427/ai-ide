/**
 * Local deploy readiness: unit tests + env verify + optional production smoke.
 *
 * Usage:
 *   npm run deploy:check
 *   APP_URL=https://your-app.vercel.app npm run deploy:check
 */
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appUrl = (process.env.APP_URL || '').replace(/\/$/, '')

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`\n❌ Failed: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.log('=== AI IDE deploy check ===\n')

run('npm', ['run', 'test:local'], 'Typecheck + unit tests')
run('node', ['scripts/verify-env.mjs', '--production'], 'Production env keys (verify-env)')

if (appUrl) {
  run('node', ['scripts/smoke-production.mjs', appUrl], `Production smoke @ ${appUrl}`)
} else {
  console.log('\nℹ️  Set APP_URL to run production smoke (optional):')
  console.log('   APP_URL=https://your-app.vercel.app npm run deploy:check')
}

console.log('\n✅ Deploy check passed')
