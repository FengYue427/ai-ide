/**
 * Smoke test: build artifacts + optional live API (vercel dev / production)
 *
 * Usage:
 *   npm test                    # required first
 *   node scripts/smoke-test.mjs
 *   API_BASE=http://localhost:3000 node scripts/smoke-test.mjs
 */
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = process.env.API_BASE || 'http://localhost:3000'

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function checkBuildArtifacts() {
  const required = ['dist/index.html', 'dist/website/index.html', 'dist/assets']
  for (const rel of required) {
    const full = join(root, rel)
    if (!existsSync(full)) {
      fail(`artifact: ${rel}`, 'missing — run npm test')
      return false
    }
  }
  pass('build artifacts', 'dist/ present')
  return true
}

async function checkApiHealth() {
  try {
    const res = await fetch(`${apiBase}/api/auth/session`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      fail('API session endpoint', `HTTP ${res.status}`)
      return
    }
    const data = await res.json()
    if (!('user' in data)) {
      fail('API session shape', 'missing user field')
      return
    }
    pass('API /api/auth/session', apiBase)
  } catch (error) {
    fail('API reachable', `${apiBase} — ${error instanceof Error ? error.message : 'unreachable'} (run npm run dev:full?)`)
  }
}

async function checkSubscriptionApi() {
  try {
    const res = await fetch(`${apiBase}/api/subscription`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data?.subscription?.plan) {
      pass('API /api/subscription', `plan=${data.subscription.plan}`)
    } else {
      fail('API /api/subscription', 'invalid response')
    }
  } catch (error) {
    fail('API /api/subscription', error instanceof Error ? error.message : 'failed')
  }
}

async function checkWorkspacesUnauthorized() {
  try {
    const res = await fetch(`${apiBase}/api/workspaces`, { signal: AbortSignal.timeout(5000) })
    if (res.status === 401) {
      pass('API workspaces auth guard', '401 without token')
    } else {
      fail('API workspaces auth guard', `expected 401, got ${res.status}`)
    }
  } catch (error) {
    fail('API /api/workspaces', error instanceof Error ? error.message : 'failed')
  }
}

console.log('--- AI IDE Smoke Test ---\n')

await checkBuildArtifacts()
await checkApiHealth()
await checkSubscriptionApi()
await checkWorkspacesUnauthorized()

const failed = results.filter((r) => !r.ok)
console.log(`\n--- Summary: ${results.length - failed.length}/${results.length} passed ---`)

if (failed.some((f) => f.name.startsWith('artifact'))) {
  process.exit(1)
}

// API failures are warnings when dev server not running
if (failed.length > 0) {
  console.log('\nNote: API checks require `npm run dev:full` with DATABASE_URL configured.')
  process.exit(failed.some((f) => !f.name.includes('API')) ? 1 : 0)
}

process.exit(0)
