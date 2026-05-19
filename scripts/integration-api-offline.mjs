/**
 * API smoke tests that do not require PostgreSQL (auth + routing only).
 *
 * Usage:
 *   API_BASE=http://127.0.0.1:3001 node scripts/integration-api-offline.mjs
 */
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')
const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function run() {
  console.log(`--- API Offline Integration @ ${apiBase} ---\n`)

  try {
    const health = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(5000) })
    if (health.ok) {
      const json = await health.json()
      if (json.status === 'ok' && json.database === 'connected') {
        pass('health endpoint', 'db connected')
      } else {
        pass('health endpoint', json.database || json.status)
      }
    } else {
      fail('health endpoint', `HTTP ${health.status}`)
    }
  } catch (error) {
    fail('health endpoint', error instanceof Error ? error.message : String(error))
  }

  try {
    const session = await fetch(`${apiBase}/api/auth/session`, { signal: AbortSignal.timeout(5000) })
    if (session.ok) {
      const json = await session.json()
      if ('user' in json) pass('session endpoint', json.user ? 'logged in' : 'anonymous')
      else fail('session endpoint', 'missing user field')
    } else {
      fail('session endpoint', `HTTP ${session.status}`)
    }
  } catch (error) {
    fail('session endpoint', error instanceof Error ? error.message : String(error))
    printSummary()
    return
  }

  try {
    const workspaces = await fetch(`${apiBase}/api/workspaces`, { signal: AbortSignal.timeout(5000) })
    if (workspaces.status === 401) pass('workspaces without auth', '401')
    else fail('workspaces without auth', `expected 401, got ${workspaces.status}`)
  } catch (error) {
    fail('workspaces without auth', error instanceof Error ? error.message : String(error))
  }

  try {
    const subscription = await fetch(`${apiBase}/api/subscription`, { signal: AbortSignal.timeout(5000) })
    if (subscription.status === 401) pass('subscription without auth', '401')
    else fail('subscription without auth', `expected 401, got ${subscription.status}`)
  } catch (error) {
    fail('subscription without auth', error instanceof Error ? error.message : String(error))
  }

  printSummary()
}

function printSummary() {
  const failed = results.filter((item) => !item.ok)
  console.log(`\n--- Offline API: ${results.length - failed.length}/${results.length} passed ---`)
  process.exit(failed.length > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
