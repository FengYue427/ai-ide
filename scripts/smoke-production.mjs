/**
 * Post-deploy smoke test against a live deployment.
 *
 * Usage:
 *   node scripts/smoke-production.mjs https://ai-ide-flame.vercel.app
 *   APP_URL=https://ai-ide-flame.vercel.app npm run smoke:production
 */
const base = (process.argv[2] || process.env.APP_URL || '').replace(/\/$/, '')

if (!base) {
  console.error('Usage: node scripts/smoke-production.mjs <APP_URL>')
  process.exit(1)
}

const checks = [
  { name: 'health', path: '/api/health', expectOk: true },
  { name: 'session', path: '/api/auth/session', expectOk: true },
  { name: 'workspaces 401', path: '/api/workspaces', expectStatus: 401 },
  { name: 'index', path: '/', expectOk: true },
]

let failed = 0

console.log(`=== Production smoke @ ${base} ===\n`)

for (const check of checks) {
  try {
    const res = await fetch(`${base}${check.path}`, { signal: AbortSignal.timeout(20_000) })
    const ct = res.headers.get('content-type') || ''
    let detail = `HTTP ${res.status}`

    if (ct.includes('application/json')) {
      const json = await res.json()
      if (check.name === 'health') {
        const billing = json.billing ? ` billing=${JSON.stringify(json.billing)}` : ''
        detail = `${json.status} db=${json.database}${billing}`
      } else if (check.name === 'session') {
        detail = json.user ? `user=${json.user.email}` : 'anonymous'
      }
    }

    const ok =
      (check.expectOk && res.ok) ||
      (check.expectStatus !== undefined && res.status === check.expectStatus)

    if (ok) {
      console.log(`✅ ${check.name} — ${detail}`)
    } else {
      console.error(`❌ ${check.name} — ${detail}`)
      failed++
    }
  } catch (error) {
    console.error(`❌ ${check.name} — ${error instanceof Error ? error.message : error}`)
    failed++
  }
}

console.log(`\n--- Smoke: ${checks.length - failed}/${checks.length} passed ---`)
process.exit(failed > 0 ? 1 : 0)
