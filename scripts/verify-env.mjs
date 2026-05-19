/**
 * Pre-deploy environment checklist (reads .env.local when present).
 *
 * Usage:
 *   node scripts/verify-env.mjs
 *   node scripts/verify-env.mjs --production
 */
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const production = process.argv.includes('--production')
const urlArgIndex = process.argv.indexOf('--url')
const remoteUrl = urlArgIndex >= 0 ? process.argv[urlArgIndex + 1]?.replace(/\/$/, '') : ''
const envPath = join(root, '.env.local')

function loadEnvFile() {
  if (!existsSync(envPath)) return
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

loadEnvFile()

const required = [
  { key: 'DATABASE_URL', hint: 'Neon/Supabase Postgres connection string' },
  { key: 'AUTH_SECRET', hint: 'openssl rand -base64 32' },
]

const recommended = [{ key: 'APP_URL', hint: 'https://your-domain.vercel.app' }]

const productionCnPay = [
  { key: 'APP_URL', hint: 'https://your-domain.com (notify & return URLs)' },
]

const productionCnPayOptional = [
  { key: 'ALIPAY_APP_ID', hint: 'Alipay open platform' },
  { key: 'ALIPAY_PRIVATE_KEY', hint: 'or ALIPAY_PRIVATE_KEY_PATH' },
  { key: 'WECHAT_APP_ID', hint: 'WeChat pay' },
  { key: 'WECHAT_MCH_ID', hint: 'merchant id' },
  { key: 'WECHAT_API_V3_KEY', hint: 'APIv3 key' },
]

const productionStripe = [
  { key: 'STRIPE_SECRET_KEY', hint: 'sk_live_... (optional overseas)' },
  { key: 'STRIPE_WEBHOOK_SECRET', hint: 'whsec_...' },
  { key: 'STRIPE_PRICE_PRO', hint: 'price_...' },
]

const oauthOptional = [
  { key: 'AUTH_GITHUB_ID', hint: 'GitHub OAuth App' },
  { key: 'AUTH_GITHUB_SECRET', hint: 'paired with AUTH_GITHUB_ID' },
  { key: 'AUTH_GOOGLE_ID', hint: 'Google OAuth client' },
  { key: 'AUTH_GOOGLE_SECRET', hint: 'paired with AUTH_GOOGLE_ID' },
]

let failed = 0

function maskValue(key, value) {
  if (key.includes('SECRET') || (key.includes('URL') && value.includes('@'))) {
    return value.replace(/:[^:@/]+@/, ':****@').slice(0, 48) + '…'
  }
  return `${value.slice(0, 12)}…`
}

function check(keys, label, { soft = false } = {}) {
  console.log(`\n${label}`)
  for (const { key, hint } of keys) {
    const value = process.env[key]?.trim()
    if (value) {
      console.log(`  ✅ ${key} ${maskValue(key, value)}`)
    } else if (soft) {
      console.log(`  ⚠️  ${key} — ${hint} (optional locally)`)
    } else {
      console.log(`  ❌ ${key} — ${hint}`)
      failed++
    }
  }
}

console.log(`=== Environment verify (${production ? 'production' : 'local'}) ===`)

check(required, 'Required for cloud auth + API:')
check(recommended, 'Recommended:', { soft: !production })

if (production) {
  check(productionCnPay, 'Required for CN payment callbacks:')
  const hasAlipay = process.env.ALIPAY_APP_ID?.trim()
  const hasWechat = process.env.WECHAT_MCH_ID?.trim()
  if (!hasAlipay && !hasWechat) {
    console.log('\n  ❌ Configure at least Alipay OR WeChat Pay for production billing')
    failed++
  } else {
    console.log('\nCN payment (production):')
    if (hasAlipay) console.log('  ✅ Alipay')
    if (hasWechat) console.log('  ✅ WeChat Pay')
  }
  check(productionStripe, 'Optional Stripe (overseas):', { soft: true })
  if (process.env.ALLOW_DEV_BILLING === 'true') {
    console.log('\n  ⚠️  ALLOW_DEV_BILLING=true — disable in production')
    failed++
  }
} else if (process.env.STRIPE_SECRET_KEY) {
  const sk = process.env.STRIPE_SECRET_KEY
  const mode = sk.startsWith('sk_live_') ? 'LIVE' : sk.startsWith('sk_test_') ? 'TEST' : 'unknown'
  console.log(`\nStripe (optional locally): configured (${mode})`)
}

const gh = process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
const go = process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
if (gh || go) {
  console.log('\nOAuth providers:')
  if (gh) console.log('  ✅ GitHub')
  if (go) console.log('  ✅ Google (Gmail)')
  if (!process.env.AUTH_URL && !process.env.APP_URL) {
    console.log('  ⚠️  Set AUTH_URL or APP_URL for OAuth redirect callbacks')
  }
} else {
  console.log('\nOAuth: not configured (email/password only)')
}

if (production && process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.log('\n  ⚠️  STRIPE_SECRET_KEY is sk_test_ — use sk_live_ for real charges')
}

if (failed > 0) {
  console.log(`\n❌ ${failed} issue(s). See docs/VERCEL_SETUP.md`)
  process.exit(1)
}

console.log('\n✅ Environment looks ready for the selected mode.')

if (remoteUrl) {
  console.log(`\n=== Remote health @ ${remoteUrl} ===`)
  try {
    const res = await fetch(`${remoteUrl}/api/health`, { signal: AbortSignal.timeout(15_000) })
    const json = await res.json()
    if (res.ok && json.status === 'ok') {
      console.log(`✅ /api/health — db=${json.database}`)
    } else {
      console.error(`❌ /api/health — HTTP ${res.status}`, json)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ /api/health —', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
