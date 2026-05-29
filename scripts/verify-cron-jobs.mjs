#!/usr/bin/env node
/**
 * Verify /api/jobs/process cron auth (local or production).
 *
 * Usage:
 *   CRON_SECRET=xxx node scripts/verify-cron-jobs.mjs
 *   APP_URL=https://your-app.vercel.app CRON_SECRET=xxx node scripts/verify-cron-jobs.mjs
 */
import { loadEnvLocal } from './load-env-local.mjs'

loadEnvLocal()

const base = (process.env.APP_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
const secret =
  process.env.CRON_SECRET?.trim() ||
  process.env.BILLING_CRON_SECRET?.trim() ||
  ''

if (!secret) {
  console.error('Set CRON_SECRET or BILLING_CRON_SECRET')
  process.exit(1)
}

const url = `${base}/api/jobs/process`

async function probe(label, headers) {
  const res = await fetch(url, { method: 'GET', headers })
  const body = await res.text()
  console.log(`[${label}] ${res.status} ${body.slice(0, 240)}`)
  return res.status
}

const noAuth = await probe('no-auth', {})
const badAuth = await probe('bad-auth', { authorization: 'Bearer invalid-token' })
const okAuth = await probe('ok-auth', { authorization: `Bearer ${secret}` })

if (noAuth !== 401 || badAuth !== 401) {
  console.error('Expected 401 without valid secret')
  process.exit(1)
}

if (okAuth !== 200) {
  console.error('Expected 200 with valid secret (check APP_URL and database migration)')
  process.exit(1)
}

console.log('✅ Cron jobs/process endpoint auth OK')
