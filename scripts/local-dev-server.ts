/**
 * Local API server for development (no Vercel CLI required).
 * Listens on PORT (default 3001). Pair with Vite proxy via `npm run dev:stack`.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { GET as sessionGET } from '../api/auth/session/route'
import { POST as registerPOST } from '../api/auth/register/route'
import { POST as loginPOST } from '../api/auth/callback/credentials/route'
import { POST as signoutPOST, GET as signoutGET } from '../api/auth/signout/route'
import { POST as forgotPasswordPOST } from '../api/auth/forgot-password/route'
import { GET as oauthCatchAllGET, POST as oauthCatchAllPOST } from '../api/auth/oauth/[...slug]/route'
import { POST as oauthSyncPOST } from '../api/auth/oauth/sync/route'
import { GET as oauthProvidersGET } from '../api/auth/oauth/providers/route'
import { GET as workspacesGET, POST as workspacesPOST } from '../api/workspaces/route'
import {
  GET as workspaceIdGET,
  PUT as workspaceIdPUT,
  DELETE as workspaceIdDELETE,
} from '../api/workspaces/[id]/route'
import { GET as subscriptionGET } from '../api/subscription/route'
import { GET as subscriptionPlansGET } from '../api/subscription/plans/route'
import { POST as subscriptionCheckoutPOST } from '../api/subscription/checkout/route'
import { POST as subscriptionWebhookPOST } from '../api/subscription/webhook/route'
import { POST as subscriptionCancelPOST } from '../api/subscription/cancel/route'
import { POST as subscriptionPortalPOST } from '../api/subscription/portal/route'
import { POST as subscriptionResumePOST } from '../api/subscription/resume/route'
import { GET as paymentMethodsGET } from '../api/subscription/payment-methods/route'
import { POST as alipayNotifyPOST } from '../api/payment/alipay/notify/route'
import { POST as wechatNotifyPOST } from '../api/payment/wechat/notify/route'
import { GET as paymentOrderGET } from '../api/payment/orders/[id]/route'
import { POST as paymentDevSimulatePOST } from '../api/payment/dev/simulate/route'
import { GET as usageAiGET, POST as usageAiPOST } from '../api/usage/ai/route'
import { GET as healthGET } from '../api/health/route'

const PORT = Number(process.env.API_PORT || 3001)

function loadEnvFile() {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

type RouteHandler = (req: Request, ctx?: { params: Record<string, string> }) => Promise<Response>

const routes: Array<{ method: string; match: (path: string) => Record<string, string> | null; handler: RouteHandler }> = [
  { method: 'GET', match: (p) => (p === '/api/health' ? {} : null), handler: healthGET },
  { method: 'GET', match: (p) => (p === '/api/auth/session' ? {} : null), handler: sessionGET },
  { method: 'POST', match: (p) => (p === '/api/auth/register' ? {} : null), handler: registerPOST },
  { method: 'POST', match: (p) => (p === '/api/auth/forgot-password' ? {} : null), handler: forgotPasswordPOST },
  { method: 'POST', match: (p) => (p === '/api/auth/callback/credentials' ? {} : null), handler: loginPOST },
  { method: 'POST', match: (p) => (p === '/api/auth/signout' ? {} : null), handler: signoutPOST },
  { method: 'GET', match: (p) => (p === '/api/auth/signout' ? {} : null), handler: signoutGET },
  { method: 'GET', match: (p) => (p === '/api/auth/oauth/providers' ? {} : null), handler: oauthProvidersGET },
  { method: 'POST', match: (p) => (p === '/api/auth/oauth/sync' ? {} : null), handler: oauthSyncPOST },
  {
    method: 'GET',
    match: (p) => (p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/providers' && p !== '/api/auth/oauth/sync' ? {} : null),
    handler: oauthCatchAllGET,
  },
  {
    method: 'POST',
    match: (p) => (p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/sync' ? {} : null),
    handler: oauthCatchAllPOST,
  },
  { method: 'GET', match: (p) => (p === '/api/workspaces' ? {} : null), handler: workspacesGET },
  { method: 'POST', match: (p) => (p === '/api/workspaces' ? {} : null), handler: workspacesPOST },
  { method: 'GET', match: (p) => (p === '/api/subscription' ? {} : null), handler: subscriptionGET },
  { method: 'GET', match: (p) => (p === '/api/subscription/plans' ? {} : null), handler: subscriptionPlansGET },
  { method: 'GET', match: (p) => (p === '/api/subscription/payment-methods' ? {} : null), handler: paymentMethodsGET },
  { method: 'POST', match: (p) => (p === '/api/payment/alipay/notify' ? {} : null), handler: alipayNotifyPOST },
  { method: 'POST', match: (p) => (p === '/api/payment/wechat/notify' ? {} : null), handler: wechatNotifyPOST },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/payment\/orders\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    handler: paymentOrderGET,
  },
  { method: 'POST', match: (p) => (p === '/api/payment/dev/simulate' ? {} : null), handler: paymentDevSimulatePOST },
  { method: 'POST', match: (p) => (p === '/api/subscription/checkout' ? {} : null), handler: subscriptionCheckoutPOST },
  { method: 'POST', match: (p) => (p === '/api/subscription/webhook' ? {} : null), handler: subscriptionWebhookPOST },
  { method: 'POST', match: (p) => (p === '/api/subscription/cancel' ? {} : null), handler: subscriptionCancelPOST },
  { method: 'POST', match: (p) => (p === '/api/subscription/portal' ? {} : null), handler: subscriptionPortalPOST },
  { method: 'POST', match: (p) => (p === '/api/subscription/resume' ? {} : null), handler: subscriptionResumePOST },
  { method: 'GET', match: (p) => (p === '/api/usage/ai' ? {} : null), handler: usageAiGET },
  { method: 'POST', match: (p) => (p === '/api/usage/ai' ? {} : null), handler: usageAiPOST },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    handler: workspaceIdGET,
  },
  {
    method: 'PUT',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    handler: workspaceIdPUT,
  },
  {
    method: 'DELETE',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    handler: workspaceIdDELETE,
  },
]

async function handleNodeRequest(
  nodeReq: import('node:http').IncomingMessage,
  nodeRes: import('node:http').ServerResponse,
) {
  const host = nodeReq.headers.host || `127.0.0.1:${PORT}`
  const url = `http://${host}${nodeReq.url || '/'}`
  const method = nodeReq.method || 'GET'

  const chunks: Buffer[] = []
  for await (const chunk of nodeReq) {
    chunks.push(chunk as Buffer)
  }
  const body = Buffer.concat(chunks)

  const headers = new Headers()
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }

  const req = new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })

  const pathname = new URL(url).pathname
  let response: Response

  try {
    const route = routes.find((r) => r.method === method && r.match(pathname))
    if (!route) {
      response = new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      const params = route.match(pathname) || {}
      response = await route.handler(req, { params })
    }
  } catch (error) {
    console.error('[local-dev-server]', error)
    response = new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  nodeRes.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      nodeRes.appendHeader(key, value)
    } else {
      nodeRes.setHeader(key, value)
    }
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  nodeRes.end(buffer)
}

loadEnvFile()

const server = createServer((req, res) => {
  handleNodeRequest(req, res).catch((err) => {
    console.error(err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Server error' }))
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[local-dev-server] http://127.0.0.1:${PORT}`)
  console.log('[local-dev-server] DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING')
})
