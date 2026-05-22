/**
 * Production smoke with markdown report (paste into DEPLOY_CHECKLIST / issues).
 *
 * Usage:
 *   npm run smoke:report
 *   node scripts/smoke-report.mjs https://ai-ide-flame.vercel.app
 */
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const base = (process.argv[2] || process.env.APP_URL || '').replace(/\/$/, '')
if (!base) {
  console.error('Usage: node scripts/smoke-report.mjs <APP_URL>')
  process.exit(1)
}

const checks = [
  { name: 'health', path: '/api/health', kind: 'health' },
  { name: 'session', path: '/api/auth/session', kind: 'ok' },
  { name: 'workspaces 401', path: '/api/workspaces', kind: 'status', expect: 401 },
  { name: 'subscription', path: '/api/subscription', kind: 'subscription' },
  { name: 'index', path: '/', kind: 'ok' },
]

const lines = []
let failed = 0
const now = new Date().toISOString()

lines.push(`# Production smoke report`)
lines.push('')
lines.push(`- **URL**: ${base}`)
lines.push(`- **Time**: ${now}`)
lines.push('')

for (const check of checks) {
  try {
    const res = await fetch(`${base}${check.path}`, { signal: AbortSignal.timeout(30_000) })
    const ct = res.headers.get('content-type') || ''
    let json = null
    if (ct.includes('application/json')) {
      try {
        json = await res.json()
      } catch {
        json = null
      }
    }

    let ok = false
    let detail = `HTTP ${res.status}`

    if (check.kind === 'health') {
      detail = `${json?.status ?? '?'} db=${json?.database ?? '?'}`
      ok = res.ok && json?.status === 'ok' && json?.database === 'connected'
      if (json?.hints?.length) detail += ` — ${json.hints[0]}`
    } else if (check.kind === 'status') {
      ok = res.status === check.expect
    } else if (check.kind === 'subscription') {
      ok = res.ok && json?.subscription?.plan === 'free'
      detail = ok ? 'anonymous free' : detail
    } else {
      ok = res.ok
    }

    lines.push(`- [${ok ? 'x' : ' '}] **${check.name}** — ${detail}`)
    if (!ok) failed++
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    lines.push(`- [ ] **${check.name}** — ${msg}`)
    failed++
  }
}

lines.push('')
lines.push(`**Result**: ${checks.length - failed}/${checks.length} passed`)
if (failed > 0) {
  lines.push('')
  lines.push('## Next steps')
  lines.push('')
  lines.push('1. Fix Vercel env — [docs/VERCEL_ENV_PHASE2.md](../docs/VERCEL_ENV_PHASE2.md)')
  lines.push('2. Redeploy')
  lines.push('3. Re-run `npm run smoke:report`')
}

const report = lines.join('\n')
console.log(report)

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'PRODUCTION_SMOKE_LAST.md')
writeFileSync(outPath, `${report}\n`, 'utf8')
console.log(`\nWrote ${outPath}`)

process.exit(failed > 0 ? 1 : 0)
