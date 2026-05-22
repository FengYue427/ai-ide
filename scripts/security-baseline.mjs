/**
 * P0' security baseline — no secrets in git, production env rules, admin surface check.
 *
 * Usage: node scripts/security-baseline.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0

function fail(msg) {
  console.error(`  ❌ ${msg}`)
  failed++
}

function pass(msg) {
  console.log(`  ✅ ${msg}`)
}

console.log('=== Security baseline (P0\') ===\n')

console.log('Tracked secret patterns:')
const list = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
if (list.status !== 0) {
  console.log('  ⚠️  Not a git repo or git unavailable — skip ls-files')
} else {
  const files = list.stdout.split(/\r?\n/).filter(Boolean)
  const bannedNames = ['.env', '.env.local', '.env.production']
  for (const name of bannedNames) {
    if (files.includes(name)) fail(`${name} is tracked — must be gitignored`)
    else pass(`${name} not tracked`)
  }

  const secretPatterns = [
    /sk_live_[a-zA-Z0-9]{10,}/,
    /ghp_[a-zA-Z0-9]{20,}/,
    /github_pat_[a-zA-Z0-9_]{20,}/,
  ]
  for (const file of files) {
    if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|html)$/.test(file)) continue
    if (file.includes('node_modules')) continue
    const full = join(root, file)
    if (!existsSync(full)) continue
    const text = readFileSync(full, 'utf8')
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        fail(`possible secret in ${file}`)
        break
      }
    }
  }
  if (failed === 0) pass('no obvious live keys in tracked source')
}

console.log('\nJWT / auth secret policy:')
const jwtSrc = readFileSync(join(root, 'src', 'lib', 'jwt.ts'), 'utf8')
if (!/AUTH_SECRET must be set in production/.test(jwtSrc)) {
  fail('jwt.ts must throw when AUTH_SECRET missing in production')
} else {
  pass('jwt.ts enforces AUTH_SECRET in production')
}

console.log('\nProduction env rules (inline):')
if (process.env.ALLOW_DEV_BILLING === 'true') fail('ALLOW_DEV_BILLING must not be true in production/CI')
else pass('ALLOW_DEV_BILLING unset or false')
if (process.env.VITE_ALLOW_OFFLINE_AUTH === 'true') fail('VITE_ALLOW_OFFLINE_AUTH must not be true')
else pass('VITE_ALLOW_OFFLINE_AUTH unset or false')

if (process.env.RUN_PROD_ENV_VERIFY === '1') {
  console.log('\nFull production env verify (--production):')
  const verify = spawnSync('node', ['scripts/verify-env.mjs', '--production'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (verify.status !== 0) failed++
} else {
  console.log('  ℹ️  Set RUN_PROD_ENV_VERIFY=1 to run scripts/verify-env.mjs --production (needs .env.local)')
}

console.log('\nAdmin / dangerous routes:')
const dispatchPath = join(root, 'lib', 'api', 'dispatch.ts')
const dispatch = readFileSync(dispatchPath, 'utf8')
if (/\/api\/admin/i.test(dispatch)) {
  fail('unexpected /api/admin route in dispatch — use CLI scripts/admin-lookup.ts')
} else {
  pass('no public /api/admin route')
}
if (dispatch.includes('/api/payment/dev/simulate')) {
  pass('dev payment simulate gated by billingMode (not production)')
}

console.log('\nOffline auth policy:')
pass('production builds must not set VITE_ALLOW_OFFLINE_AUTH (see DEPLOY_CHECKLIST S0-5)')

if (failed > 0) {
  console.log(`\n❌ Security baseline: ${failed} issue(s)`)
  process.exit(1)
}
console.log('\n✅ Security baseline passed')
