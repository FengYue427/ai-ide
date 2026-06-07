/**
 * v1.6.0 GA preflight — CN billing + platform AI + cron + release gates.
 * Usage: npm run v16:preflight
 *        npm run v16:preflight -- --production
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const production = process.argv.includes('--production')

loadEnvLocal()

function run(label, cmd, args, extraEnv = {}) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  })
  if (result.status !== 0) {
    console.error(`\n❌ ${label} failed`)
    process.exit(result.status ?? 1)
  }
}

console.log('=== v1.6.0 GA preflight ===')
console.log(`Mode: ${production ? 'production checks' : 'local/dev checks'}`)

run('Unit tests', 'npm', ['run', 'test:unit'])

if (production) {
  run('Env v16 production', 'npm', ['run', 'verify:env:v16'])
  run('Alipay production preflight', 'npm', ['run', 'billing:preflight:production'])
} else {
  run('Env (local)', 'npm', ['run', 'verify:env'])
  run('CN billing preflight', 'npm', ['run', 'billing:preflight'])
}

run('Release gates', 'npm', ['run', 'verify:release:gates'])

console.log('\n✅ v1.6 preflight passed for selected mode.')
console.log('Next: V1.6_GA_EXECUTION.md P0 checklist (Alipay live smoke · PLATFORM_DEEPSEEK_API_KEY on Vercel)')
