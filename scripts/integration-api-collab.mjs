/**
 * Collaboration room API smoke (v1.1.3 F4).
 * Called from scripts/integration-api.mjs when DATABASE_URL is available.
 *
 * @param {object} ctx
 * @param {string} ctx.apiBase
 * @param {() => string} ctx.getCookieA
 * @param {(cookie: string) => void} ctx.setCookieA
 * @param {(name: string, detail?: string) => void} ctx.pass
 * @param {(name: string, detail?: string) => void} ctx.fail
 * @param {(path: string, options?: RequestInit & { headers?: Record<string, string> }) => Promise<{ res: Response; json: unknown }>} ctx.api
 */
export async function runCollabIntegrationSmoke(ctx) {
  const { apiBase, pass, fail, api } = ctx
  let cookieA = ctx.getCookieA()

  async function apiWithCookie(cookie, path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    }
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(15_000),
    })
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

  function extractCookie(setCookieHeader) {
    if (!setCookieHeader) return ''
    const match = setCookieHeader.match(/auth-token=([^;]+)/)
    return match ? `auth-token=${match[1]}` : ''
  }

  try {
    const unauth = await fetch(`${apiBase}/api/collab/rooms`, { signal: AbortSignal.timeout(5000) })
    if (unauth.status === 401) pass('collab rooms without auth', '401')
    else fail('collab rooms without auth', `expected 401, got ${unauth.status}`)
  } catch (error) {
    fail('collab rooms without auth', error instanceof Error ? error.message : String(error))
    return
  }

  let collabCode = null
  try {
    const { res, json } = await api('/api/collab/rooms', { method: 'POST', body: '{}' })
    if (res.status === 201 && json?.room?.code) {
      collabCode = json.room.code
      pass('collab POST create', collabCode)
    } else {
      const hint =
        res.status === 500
          ? ' (CollaborationRoom migration missing? run: npx prisma migrate deploy)'
          : ''
      fail('collab POST create', (json?.message || json?.error || `HTTP ${res.status}`) + hint)
      return
    }
  } catch (error) {
    fail('collab POST create', error instanceof Error ? error.message : String(error))
    return
  }

  cookieA = ctx.getCookieA()

  const emailB = `collab-b-${Date.now()}@ai-ide.local`
  const passwordB = 'TestPass123!'
  let cookieB = ''

  try {
    const reg = await fetch(`${apiBase}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: passwordB, name: 'Collab B' }),
      signal: AbortSignal.timeout(15_000),
    })
    const regJson = reg.headers.get('content-type')?.includes('json') ? await reg.json() : null
    cookieB = extractCookie(reg.headers.get('set-cookie'))
    if (reg.ok && regJson?.user?.email === emailB && cookieB) {
      pass('collab register user B', emailB)
    } else {
      fail('collab register user B', regJson?.error || `HTTP ${reg.status}`)
      return
    }
  } catch (error) {
    fail('collab register user B', error instanceof Error ? error.message : String(error))
    return
  }

  let userIdB = null
  try {
    const { res, json } = await apiWithCookie(cookieB, '/api/auth/session')
    if (res.ok && json?.user?.id) {
      userIdB = json.user.id
      pass('collab session user B', userIdB)
    } else {
      fail('collab session user B', json?.error || `HTTP ${res.status}`)
      return
    }
  } catch (error) {
    fail('collab session user B', error instanceof Error ? error.message : String(error))
    return
  }

  try {
    const { res, json } = await apiWithCookie(
      cookieB,
      `/api/collab/rooms/${encodeURIComponent(collabCode)}`,
      { method: 'POST', body: JSON.stringify({ role: 'viewer' }) },
    )
    const member = json?.room?.members?.find((m) => m.userId === userIdB)
    if (res.ok && member?.role === 'viewer') {
      pass('collab join as viewer', collabCode)
    } else {
      fail('collab join as viewer', json?.message || member?.role || `HTTP ${res.status}`)
    }
  } catch (error) {
    fail('collab join as viewer', error instanceof Error ? error.message : String(error))
  }

  try {
    const { res } = await apiWithCookie(
      cookieB,
      `/api/collab/rooms/${encodeURIComponent(collabCode)}/members/${encodeURIComponent(userIdB)}`,
      { method: 'PATCH', body: JSON.stringify({ role: 'editor' }) },
    )
    if (res.status === 403) pass('collab viewer cannot patch role', '403')
    else fail('collab viewer cannot patch role', `expected 403, got ${res.status}`)
  } catch (error) {
    fail('collab viewer cannot patch role', error instanceof Error ? error.message : String(error))
  }

  try {
    const { res, json } = await apiWithCookie(
      cookieA,
      `/api/collab/rooms/${encodeURIComponent(collabCode)}/members/${encodeURIComponent(userIdB)}`,
      { method: 'PATCH', body: JSON.stringify({ role: 'editor' }) },
    )
    const member = json?.room?.members?.find((m) => m.userId === userIdB)
    if (res.ok && member?.role === 'editor') pass('collab host patch role', 'editor')
    else fail('collab host patch role', json?.message || member?.role || `HTTP ${res.status}`)
  } catch (error) {
    fail('collab host patch role', error instanceof Error ? error.message : String(error))
  }

  try {
    const { res, json } = await apiWithCookie(
      cookieA,
      `/api/collab/rooms/${encodeURIComponent(collabCode)}/members/${encodeURIComponent(userIdB)}/kick`,
      { method: 'POST', body: '{}' },
    )
    const stillIn = json?.room?.members?.some((m) => m.userId === userIdB)
    if (res.ok && !stillIn) pass('collab host kick member', userIdB)
    else fail('collab host kick member', json?.message || `HTTP ${res.status}`)
  } catch (error) {
    fail('collab host kick member', error instanceof Error ? error.message : String(error))
  }

  try {
    const { res } = await apiWithCookie(
      cookieB,
      `/api/collab/rooms/${encodeURIComponent(collabCode)}/leave`,
      { method: 'POST', body: '{}' },
    )
    if (res.ok) pass('collab leave after kick', '200 or idempotent')
    else if (res.status === 403) pass('collab leave after kick', '403 not member (ok)')
    else fail('collab leave after kick', `HTTP ${res.status}`)
  } catch (error) {
    fail('collab leave after kick', error instanceof Error ? error.message : String(error))
  }
}
