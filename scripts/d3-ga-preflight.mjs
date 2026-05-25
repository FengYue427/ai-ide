/**
 * D3 GA preflight: tests + API bundle + production env (Path B) + legal assets.
 *
 * Usage:
 *   npm run d3:preflight
 *   APP_URL=https://ai-ide-flame.vercel.app npm run d3:preflight -- --url https://...
 */
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const extraArgs = process.argv.slice(2).filter((a) => a.startsWith('--'))

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`\n❌ Failed: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.log('=== AI IDE D3 GA preflight ===\n')

const legalFiles = [
  'public/legal/payment.html',
  'public/legal/payment-en.html',
  'public/legal/terms.html',
  'public/legal/privacy.html',
]

console.log('Legal pages:')
let legalMissing = 0
for (const rel of legalFiles) {
  const path = join(root, rel)
  if (existsSync(path)) {
    console.log(`  ✅ ${rel}`)
  } else {
    console.log(`  ❌ ${rel}`)
    legalMissing++
  }
}
if (legalMissing > 0) process.exit(1)

run('Typecheck + unit tests', 'npm', ['run', 'test:local'])
run('API bundle', 'npm', ['run', 'build:api'])
run('Production env (Path B + D3)', 'node', [
  'scripts/verify-env.mjs',
  '--production',
  '--require-cn-billing',
  '--d3-ga',
  ...extraArgs,
])

console.log('\n✅ D3 GA preflight passed (code + env file checks)')
console.log('Manual before GA: docs/D3_GA_ACCEPTANCE.md')
console.log('Production deploy: docs/DEPLOY_D3_GA.md')
console.log('Remote smoke: APP_URL=https://your-app npm run smoke:report')
