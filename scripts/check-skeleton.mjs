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

const requiredRoutes = [
  'api/auth/register/route.ts',
  'api/auth/session/route.ts',
  'api/auth/signout/route.ts',
  'api/auth/oauth/sync/route.ts',
  'api/subscription/checkout/route.ts',
  'api/subscription/payment-methods/route.ts',
  'api/payment/alipay/notify/route.ts',
  'api/payment/wechat/notify/route.ts',
  'api/payment/orders/[id]/route.ts',
  'api/payment/dev/simulate/route.ts',
  'api/health/route.ts',
  'api/mcp/proxy/route.ts',
]

for (const route of requiredRoutes) {
  if (existsSync(join(root, route))) ok(`route ${route}`)
  else bad(`Missing ${route}`)
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
