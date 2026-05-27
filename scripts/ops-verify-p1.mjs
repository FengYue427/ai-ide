#!/usr/bin/env node
/**
 * v1.0.3 Phase 1 — ops封板一键验收（本地 + 可选生产）。
 *
 * Usage:
 *   npm run ops:verify-p1
 *   APP_URL=https://ide.example.com npm run ops:verify-p1
 *   APP_URL=... CRON_SECRET=... npm run ops:verify-p1   # 含 Cron 全链路
 *
 * See docs/V1.0.3_PHASE1_OPS.md
 */
import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadEnvLocal } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appUrl = (process.env.APP_URL || 'https://ai-ide-flame.vercel.app').replace(/\/$/, '')

function run(label, cmd, args, { optional = false } = {}) {
  console.log(`\n=== ${label} ===`)
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) {
    if (optional) {
      console.log(`⚠️  ${label} skipped or failed (optional)`)
      return false
    }
    process.exit(r.status ?? 1)
  }
  return true
}

loadEnvLocal()

const withLocalEnv = process.argv.includes('--with-local-env')

console.log('# v1.0.3 Phase 1 — ops verify')
console.log(`- APP_URL: ${appUrl}`)
console.log(`- Time: ${new Date().toISOString()}`)

run('Unit + typecheck', 'npm', ['run', 'test:local'])

if (withLocalEnv && existsSync(join(root, '.env.local'))) {
  run('Env checklist (local .env.local → production rules)', 'node', [
    'scripts/verify-env.mjs',
    '--production',
    '--require-cn-billing',
    '--d3-ga',
    '--url',
    appUrl,
  ])
} else {
  console.log('\n=== Env checklist ===')
  console.log(
    'ℹ️  Skipped local verify-env (dev .env.local often has ALIPAY_SANDBOX).',
  )
  console.log('   Vercel Production: see docs/V1.0.3_VERCEL_ENV.md')
  console.log('   Optional: npm run ops:verify-p1 -- --with-local-env')
}

run('Production smoke', 'node', ['scripts/smoke-report.mjs', appUrl])

console.log('\n=== Cron auth (anonymous) ===')
try {
  const res = await fetch(`${appUrl}/api/billing/expire-subscriptions`, {
    signal: AbortSignal.timeout(15_000),
  })
  if (res.status === 401) {
    console.log('✅ expire-subscriptions returns 401 without Bearer (expected)')
  } else {
    console.error(`❌ expected 401, got ${res.status}`)
    process.exit(1)
  }
} catch (e) {
  console.error('❌ cron probe failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}

const cronSecret = process.env.CRON_SECRET?.trim() || process.env.BILLING_CRON_SECRET?.trim()
if (cronSecret) {
  run('Cron auth (full)', 'node', ['scripts/verify-cron-expire.mjs'], { optional: false })
} else {
  console.log('\n=== Cron auth (full) ===')
  console.log('⚠️  Set CRON_SECRET or BILLING_CRON_SECRET to run billing:verify-cron')
}

console.log('\n=== Legal pages (static) ===')
for (const file of ['public/legal/payment.html', 'public/legal/payment-en.html', 'public/legal/privacy.html']) {
  const path = join(root, file)
  if (!existsSync(path)) {
    console.error(`❌ missing ${file}`)
    process.exit(1)
  }
  const html = readFileSync(path, 'utf8')
  if (/TODO|placeholder/i.test(html)) {
    console.log(`⚠️  ${file} contains placeholder text — review before GA`)
  } else {
    console.log(`✅ ${file}`)
  }
}

console.log('\n=== Sentry (build-time) ===')
if (process.env.VITE_SENTRY_DSN?.trim()) {
  console.log('✅ VITE_SENTRY_DSN present locally — set same on Vercel for ai-ide@1.0.3')
} else {
  console.log('⚠️  VITE_SENTRY_DSN not in env — configure on Vercel (docs/OBSERVABILITY.md)')
}

console.log('\n✅ Phase 1 ops verify complete.')
console.log('Next: docs/V1.0.3_KICKOFF.md Phase 2 (RC)')
