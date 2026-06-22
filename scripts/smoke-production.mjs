/**
 * Post-deploy smoke test against a live deployment.
 *
 * Usage:
 *   node scripts/smoke-production.mjs https://ai-ide-flame.vercel.app
 *   APP_URL=https://ai-ide-flame.vercel.app npm run smoke:production
 */
import { isAcceptableSmokeHealthVersion, smokeHealthVersionHint } from './smoke-health-version.mjs'

const base = (process.argv[2] || process.env.APP_URL || '').replace(/\/$/, '')

if (!base) {
  console.error('Usage: node scripts/smoke-production.mjs <APP_URL>')
  process.exit(1)
}

const checks = [
  { name: 'health', path: '/api/health', expectOk: true },
  { name: 'session', path: '/api/auth/session', expectOk: true },
  { name: 'workspaces 401', path: '/api/workspaces', expectStatus: 401 },
  { name: 'shares 401', path: '/api/shares', expectStatus: 401 },
  { name: 'subscription anonymous', path: '/api/subscription', expectSubscriptionFree: true },
  { name: 'index', path: '/', expectOk: true },
]

let failed = 0

console.log(`=== Production smoke @ ${base} ===\n`)

for (const check of checks) {
  try {
    const res = await fetch(`${base}${check.path}`, { signal: AbortSignal.timeout(30_000) })
    const ct = res.headers.get('content-type') || ''
    let detail = `HTTP ${res.status}`

    let json = null
    if (ct.includes('application/json')) {
      json = await res.json()
      if (check.name === 'health') {
        const billing = json.billing ? ` billing=${JSON.stringify(json.billing)}` : ''
        const plugins = json.plugins
          ? ` plugins.publish=${json.plugins.publishEnabled} officialKey=${json.plugins.officialKeyConfigured}`
          : ''
        detail = `v=${json.version ?? '?'} ${json.status} db=${json.database}${billing}${plugins}`
      } else if (check.name === 'session') {
        detail = json.user ? `user=${json.user.email}` : 'anonymous'
      } else if (check.expectSubscriptionFree) {
        detail = json?.subscription?.plan === 'free' ? 'anonymous free plan' : `plan=${json?.subscription?.plan}`
      }
    }

    let ok =
      (check.expectOk && res.ok) ||
      (check.expectStatus !== undefined && res.status === check.expectStatus)

    if (check.expectSubscriptionFree) {
      ok = res.ok && json?.subscription?.plan === 'free'
    }

    if (check.name === 'health' && json) {
      const dbOk = json.database === 'connected'
      const statusOk = json.status === 'ok'
      const versionOk = isAcceptableSmokeHealthVersion(json.version)
      ok = res.ok && dbOk && statusOk && versionOk
      if (!versionOk) {
        detail += ` — ${smokeHealthVersionHint(json.version)}`
      }
      if (!dbOk) {
        detail += ' — check DATABASE_URL (Neon or Aliyun RDS) and run db:migrate:deploy'
      }
      if (Array.isArray(json?.hints) && json.hints.length > 0) {
        detail += ` | ${json.hints[0]}`
      }
    }

    if (ok) {
      console.log(`✅ ${check.name} — ${detail}`)
    } else {
      console.error(`❌ ${check.name} — ${detail}`)
      failed++
    }
  } catch (error) {
    const hint =
      error instanceof Error && error.cause instanceof Error
        ? ` (${error.cause.message})`
        : ''
    console.error(`❌ ${check.name} — ${error instanceof Error ? error.message : error}${hint}`)
    failed++
  }
}

console.log(`\n--- Smoke: ${checks.length - failed}/${checks.length} passed ---`)
process.exit(failed > 0 ? 1 : 0)
