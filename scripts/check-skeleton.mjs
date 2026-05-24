/**
 * Pre-flight skeleton check (no Alipay/WeChat credentials required).
 *
 * Usage: node scripts/check-skeleton.mjs
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skipTests = process.argv.includes('--skip-tests')
let failed = 0

function ok(msg) {
  console.log(`✅ ${msg}`)
}

function bad(msg) {
  console.error(`❌ ${msg}`)
  failed++
}

console.log('=== AI IDE skeleton check ===\n')

const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8')
if (schema.includes('model PaymentOrder')) ok('Prisma PaymentOrder model')
else bad('Missing PaymentOrder in schema — run npm run db:neon')

const requiredApi = [
  'server/vercel-api-index.ts',
  'api/health.ts',
  'lib/api/dispatch.ts',
  'lib/api/handlers/health.ts',
  'lib/api/handlers/auth/register.ts',
  'lib/api/handlers/auth/session.ts',
  'lib/api/handlers/auth/signout.ts',
  'lib/api/handlers/auth/oauth/sync.ts',
  'lib/api/handlers/subscription/checkout.ts',
  'lib/api/handlers/subscription/payment-methods.ts',
  'lib/api/handlers/payment/alipay/notify.ts',
  'lib/api/handlers/payment/wechat/notify.ts',
  'lib/api/handlers/payment/orders/byId.ts',
  'lib/api/handlers/payment/dev/simulate.ts',
  'lib/api/handlers/mcp/proxy.ts',
]

for (const file of requiredApi) {
  if (existsSync(join(root, file))) ok(`api ${file}`)
  else bad(`Missing ${file}`)
}

if (existsSync(join(root, 'docs/BILLING_SKELETON.md'))) ok('docs/BILLING_SKELETON.md')
else bad('Missing docs/BILLING_SKELETON.md')

if (!skipTests) {
  console.log('\n--- Running test:local ---\n')
  const test = spawnSync('npm', ['run', 'test:local'], { cwd: root, shell: true, stdio: 'inherit' })
  if (test.status !== 0) {
    bad('test:local failed')
  } else {
    ok('test:local passed')
  }
} else {
  console.log('\n--- Skipping test:local (already run) ---\n')
}

console.log(`\n--- Skeleton: ${failed === 0 ? 'READY' : `${failed} issue(s)`} ---`)
process.exit(failed > 0 ? 1 : 0)
