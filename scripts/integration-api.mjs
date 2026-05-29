/**
 * End-to-end API integration test (requires dev:full + DATABASE_URL)
 *
 * Usage:
 *   API_BASE=http://localhost:3000 node scripts/integration-api.mjs
 */
const apiBase = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '')
const testEmail = `test-${Date.now()}@ai-ide.local`
const testPassword = 'TestPass123!'
let cookie = ''

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return
  const match = setCookieHeader.match(/auth-token=([^;]+)/)
  if (match) cookie = `auth-token=${match[1]}`
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
    ...options.headers,
  }
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15000),
  })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) extractCookie(setCookie)

  let json = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      json = await res.json()
    } catch {
      json = null
    }
  }
  return { res, json }
}

async function run() {
  console.log(`--- API Integration Test @ ${apiBase} ---\n`)

  // 1. Unauthorized workspace
  try {
    const { res } = await api('/api/workspaces')
    if (res.status === 401) pass('workspaces without auth', '401')
    else fail('workspaces without auth', `expected 401, got ${res.status}`)
  } catch (e) {
    fail('workspaces without auth', e.message)
    printSummaryAndExit()
    return
  }

  // 2. Register
  try {
    const { res, json } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword, name: 'Test User' }),
    })
    if (res.ok && json?.user?.email === testEmail) {
      pass('register', testEmail)
    } else {
      const hint =
        res.status === 500
          ? ' (database unreachable? run: npm run db:check)'
          : ''
      fail('register', (json?.error || `HTTP ${res.status}`) + hint)
      printSummaryAndExit()
      return
    }
  } catch (e) {
    fail('register', e.message)
    printSummaryAndExit()
    return
  }

  // 3. Session
  try {
    const { res, json } = await api('/api/auth/session')
    if (res.ok && json?.user?.email === testEmail) pass('session', json.user.id)
    else fail('session', json?.error || `HTTP ${res.status}`)
  } catch (e) {
    fail('session', e.message)
  }

  // 4. Save workspace
  const sampleFiles = JSON.stringify([
    { name: 'main.js', content: "console.log('cloud sync');", language: 'javascript' },
  ])
  const sampleSettings = JSON.stringify({ theme: 'vs-dark', autosave: true })

  try {
    const { res, json } = await api('/api/workspaces/default', {
      method: 'PUT',
      body: JSON.stringify({ files: sampleFiles, settings: sampleSettings, name: 'default' }),
    })
    if (res.ok && json?.success) pass('workspace PUT', 'default')
    else fail('workspace PUT', json?.error || `HTTP ${res.status}`)
  } catch (e) {
    fail('workspace PUT', e.message)
  }

  // 5. Load workspace
  try {
    const { res, json } = await api('/api/workspaces/default')
    if (res.ok && json?.workspace?.files?.includes('cloud sync')) {
      pass('workspace GET', 'files persisted')
    } else {
      fail('workspace GET', 'content mismatch or HTTP error')
    }
  } catch (e) {
    fail('workspace GET', e.message)
  }

  // 6. List workspaces
  try {
    const { res, json } = await api('/api/workspaces')
    if (res.ok && Array.isArray(json?.workspaces) && json.workspaces.length >= 1) {
      pass('workspace LIST', `${json.workspaces.length} workspace(s)`)
    } else {
      fail('workspace LIST', `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('workspace LIST', e.message)
  }

  // 6c. Background jobs (v1.1.2 F1)
  let jobId = null
  try {
    const unauth = await fetch(`${apiBase}/api/jobs`)
    if (unauth.status === 401) pass('jobs without auth', '401')
    else fail('jobs without auth', `expected 401, got ${unauth.status}`)
  } catch (e) {
    fail('jobs without auth', e.message)
  }

  try {
    const { res, json } = await api('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'integration smoke task', repoKey: 'default' }),
    })
    if (res.status === 201 && json?.job?.status === 'queued' && json.job.id) {
      jobId = json.job.id
      pass('jobs POST create', `queued id=${jobId}`)
    } else {
      fail('jobs POST create', json?.error || json?.message || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('jobs POST create', e.message)
  }

  if (jobId) {
    try {
      const { res, json } = await api(`/api/jobs/${jobId}`)
      if (res.ok && json?.job?.status === 'queued' && json.job.prompt?.includes('integration smoke')) {
        pass('jobs GET by id', jobId)
      } else {
        fail('jobs GET by id', json?.error || `status=${json?.job?.status}`)
      }
    } catch (e) {
      fail('jobs GET by id', e.message)
    }

    try {
      const { res, json } = await api('/api/jobs')
      if (res.ok && Array.isArray(json?.jobs) && json.jobs.some((j) => j.id === jobId)) {
        pass('jobs GET list', `${json.jobs.length} job(s)`)
      } else {
        fail('jobs GET list', `HTTP ${res.status}`)
      }
    } catch (e) {
      fail('jobs GET list', e.message)
    }

    let workerJobId = null
    try {
      const { res, json } = await api('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'worker integration smoke' }),
      })
      if (res.status === 201 && json?.job?.status === 'queued' && json.job.id) {
        workerJobId = json.job.id
      } else {
        fail('jobs POST worker job', json?.error || `HTTP ${res.status}`)
      }
    } catch (e) {
      fail('jobs POST worker job', e.message)
    }

    const cronSecret =
      process.env.CRON_SECRET?.trim() || process.env.BILLING_CRON_SECRET?.trim() || ''
    if (workerJobId && cronSecret) {
      try {
        const processRes = await fetch(`${apiBase}/api/jobs/process`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${cronSecret}` },
          signal: AbortSignal.timeout(15000),
        })
        const processJson = processRes.headers.get('content-type')?.includes('json')
          ? await processRes.json()
          : null
        if (processRes.ok && processJson?.success) {
          pass('jobs cron process', `processed=${processJson.processed}`)
        } else {
          fail('jobs cron process', processJson?.error || `HTTP ${processRes.status}`)
        }

        const { res, json } = await api(`/api/jobs/${workerJobId}`)
        if (res.ok && json?.job?.status === 'succeeded' && json.job.result?.mode === 'dummy') {
          pass('jobs worker succeeded', workerJobId)
        } else {
          fail('jobs worker succeeded', `status=${json?.job?.status}`)
        }
      } catch (e) {
        fail('jobs worker pipeline', e.message)
      }
    } else if (workerJobId) {
      pass('jobs worker pipeline', 'skipped (set CRON_SECRET to run cron)')
    }

    try {
      const { res, json } = await api(`/api/jobs/${jobId}/cancel`, { method: 'POST', body: '{}' })
      if (res.ok && json?.job?.status === 'cancelled') {
        pass('jobs POST cancel', jobId)
      } else {
        fail('jobs POST cancel', json?.error || `status=${json?.job?.status}`)
      }
    } catch (e) {
      fail('jobs POST cancel', e.message)
    }

    try {
      const { res, json } = await api(`/api/jobs/${jobId}/cancel`, { method: 'POST', body: '{}' })
      if (res.status === 409) pass('jobs cancel twice', '409 not cancellable')
      else fail('jobs cancel twice', `expected 409, got ${res.status}`)
    } catch (e) {
      fail('jobs cancel twice', e.message)
    }
  }

  // 6b. Usage quota — free plan hard limit (50/day)
  try {
    const getUsage = await api('/api/usage/ai')
    if (!getUsage.res.ok || !getUsage.json?.quota) {
      fail('usage quota GET before limit', getUsage.json?.error || `HTTP ${getUsage.res.status}`)
    } else {
      pass('usage quota GET before limit', `${getUsage.json.quota.used}/${getUsage.json.quota.limit}`)
    }

    const freeLimit = getUsage.json?.quota?.limit ?? 50
    const used = getUsage.json?.quota?.used ?? 0
    const remaining =
      typeof freeLimit === 'number' && freeLimit > 0 ? Math.max(0, freeLimit - used) : 50

    if (remaining > 0) {
      const fill = await api('/api/usage/ai', {
        method: 'POST',
        body: JSON.stringify({ amount: remaining }),
      })
      if (!fill.res.ok && fill.res.status !== 429) {
        fail('usage quota fill to limit', fill.json?.error || `HTTP ${fill.res.status}`)
      }
    }

    const over = await api('/api/usage/ai', {
      method: 'POST',
      body: JSON.stringify({ amount: 1 }),
    })
    if (over.res.status === 429) {
      pass('usage POST 429 at limit', 'server enforced')
    } else if (results.some((r) => r.name === 'usage quota fill to limit' && !r.ok)) {
      // already failed fill step
    } else {
      fail('usage POST 429 at limit', `expected 429, got ${over.res.status}`)
    }
  } catch (e) {
    fail('usage quota enforcement', e.message)
  }

  // 7. Subscription
  try {
    const { res, json } = await api('/api/subscription')
    if (res.ok && json?.subscription?.plan) pass('subscription', json.subscription.plan)
    else fail('subscription', `HTTP ${res.status}`)
  } catch (e) {
    fail('subscription', e.message)
  }

  // 7a. Payment methods + health billing
  try {
    const { res, json } = await api('/api/subscription/payment-methods')
    if (res.ok && typeof json?.devMock === 'boolean') {
      pass('payment-methods', `devMock=${json.devMock} alipay=${json.alipay}`)
    } else {
      fail('payment-methods', `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('payment-methods', e.message)
  }

  try {
    const { res, json } = await api('/api/health')
    if (res.ok && json?.billing) pass('health billing', JSON.stringify(json.billing))
    else fail('health billing', `HTTP ${res.status}`)
  } catch (e) {
    fail('health billing', e.message)
  }

  // 7a2. CN payment simulate (dev only — full order + fulfill path)
  let simulatedOrderId = null
  try {
    const { res, json } = await api('/api/payment/dev/simulate', {
      method: 'POST',
      body: JSON.stringify({ planId: 'enterprise', channel: 'alipay' }),
    })
    if (res.status === 403) {
      pass('payment dev simulate', 'skipped (production-like env)')
    } else if (res.ok && json?.plan === 'enterprise') {
      simulatedOrderId = json.orderId || null
      pass('payment dev simulate', `enterprise order=${json.outTradeNo || 'ok'}`)
    } else {
      fail('payment dev simulate', json?.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('payment dev simulate', e.message)
  }

  if (simulatedOrderId) {
    try {
      const { res, json } = await api(`/api/payment/orders/${simulatedOrderId}`)
      if (res.ok && json?.order?.status === 'paid') {
        pass('payment order GET', `paid ${json.order.planName}`)
      } else {
        fail('payment order GET', json?.error || `status=${json?.order?.status}`)
      }
    } catch (e) {
      fail('payment order GET', e.message)
    }
  }

  // 7b. Dev checkout (no Stripe)
  try {
    const { res, json } = await api('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: 'pro' }),
    })
    if (res.ok && json?.mode === 'dev_mock' && json?.plan === 'pro') {
      pass('checkout dev_mock', 'pro')
    } else if (json?.mode === 'stripe' && json?.url) {
      pass('checkout stripe', 'url returned')
    } else {
      fail('checkout', json?.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('checkout', e.message)
  }

  // 7c. Subscription after upgrade (dev_mock or simulate may have set enterprise)
  try {
    const { res, json } = await api('/api/subscription')
    const plan = json?.subscription?.plan
    if (res.ok && (plan === 'pro' || plan === 'enterprise')) {
      pass('subscription upgraded', plan)
    } else {
      fail('subscription upgraded', plan || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('subscription upgraded', e.message)
  }

  // 7b2. AI usage record + quota
  try {
    const getUsage = await api('/api/usage/ai')
    if (getUsage.res.ok && getUsage.json?.quota?.plan) {
      pass('usage GET', `${getUsage.json.quota.used}/${getUsage.json.quota.limit}`)
    } else {
      fail('usage GET', getUsage.json?.error || `HTTP ${getUsage.res.status}`)
    }

    const postUsage = await api('/api/usage/ai', { method: 'POST', body: JSON.stringify({ amount: 1 }) })
    if (postUsage.res.ok && postUsage.json?.quota?.used >= 1) {
      pass('usage POST', `used=${postUsage.json.quota.used}`)
    } else {
      fail('usage POST', postUsage.json?.error || `HTTP ${postUsage.res.status}`)
    }
  } catch (e) {
    fail('usage', e.message)
  }

  // 7d. Cancel at period end
  try {
    const { res, json } = await api('/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate: false }),
    })
    if (res.ok && json?.subscription?.cancelAtPeriodEnd) {
      pass('subscription cancel scheduled', 'cancelAtPeriodEnd')
    } else {
      fail('subscription cancel scheduled', json?.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('subscription cancel scheduled', e.message)
  }

  // 7d2. Resume subscription
  try {
    const { res, json } = await api('/api/subscription/resume', { method: 'POST', body: '{}' })
    if (res.ok && json?.subscription && json.subscription.cancelAtPeriodEnd === false) {
      pass('subscription resume', 'cancelAtPeriodEnd=false')
    } else {
      fail('subscription resume', json?.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    fail('subscription resume', e.message)
  }

  // 7e. Immediate downgrade
  try {
    const { res, json } = await api('/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate: true }),
    })
    if (res.ok && json?.subscription?.plan === 'free') {
      pass('subscription immediate downgrade', 'free')
    } else {
      const sub = await api('/api/subscription')
      if (sub.json?.subscription?.plan === 'free') pass('subscription immediate downgrade', 'free (via GET)')
      else fail('subscription immediate downgrade', json?.error || sub.json?.subscription?.plan)
    }
  } catch (e) {
    fail('subscription immediate downgrade', e.message)
  }

  // 8. Login with credentials (fresh cookie)
  cookie = ''
  try {
    const { res, json } = await api('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    })
    if (res.ok && json?.user?.email === testEmail) pass('login', 'credentials')
    else fail('login', json?.error || `HTTP ${res.status}`)
  } catch (e) {
    fail('login', e.message)
  }

  // 9. Sign out
  try {
    const { res } = await api('/api/auth/signout', { method: 'POST' })
    if (res.ok) pass('signout')
    else fail('signout', `HTTP ${res.status}`)
  } catch (e) {
    fail('signout', e.message)
  }

  printSummaryAndExit()
}

function printSummaryAndExit() {
  const failed = results.filter((r) => !r.ok)
  console.log(`\n--- Integration: ${results.length - failed.length}/${results.length} passed ---`)
  process.exit(failed.length > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
