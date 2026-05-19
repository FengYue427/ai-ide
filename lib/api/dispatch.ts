/**
 * Single API router for Vercel Hobby (≤12 Serverless Functions).
 * All /api/* traffic is handled by `api/[...path].ts` → dispatchApiRequest.
 */
import { GET as healthGET } from './handlers/health'
import { GET as sessionGET } from './handlers/auth/session'
import { POST as registerPOST } from './handlers/auth/register'
import { POST as loginPOST } from './handlers/auth/callback/credentials'
import { POST as signoutPOST, GET as signoutGET } from './handlers/auth/signout'
import { POST as forgotPasswordPOST } from './handlers/auth/forgot-password'
import { GET as oauthCatchAllGET, POST as oauthCatchAllPOST } from './handlers/auth/oauth/catchAll'
import { POST as oauthSyncPOST } from './handlers/auth/oauth/sync'
import { GET as oauthProvidersGET } from './handlers/auth/oauth/providers'
import { GET as authCatchAllGET } from './handlers/auth/authCatchAll'
import { GET as workspacesGET, POST as workspacesPOST } from './handlers/workspaces/index'
import {
  GET as workspaceIdGET,
  PUT as workspaceIdPUT,
  DELETE as workspaceIdDELETE,
} from './handlers/workspaces/byId'
import { GET as subscriptionGET } from './handlers/subscription/index'
import { GET as subscriptionPlansGET } from './handlers/subscription/plans'
import { POST as subscriptionCheckoutPOST } from './handlers/subscription/checkout'
import { POST as subscriptionWebhookPOST } from './handlers/subscription/webhook'
import { POST as subscriptionCancelPOST } from './handlers/subscription/cancel'
import { POST as subscriptionPortalPOST } from './handlers/subscription/portal'
import { POST as subscriptionResumePOST } from './handlers/subscription/resume'
import { GET as paymentMethodsGET } from './handlers/subscription/payment-methods'
import { POST as alipayNotifyPOST } from './handlers/payment/alipay/notify'
import { POST as wechatNotifyPOST } from './handlers/payment/wechat/notify'
import { GET as paymentOrderGET } from './handlers/payment/orders/byId'
import { POST as paymentDevSimulatePOST } from './handlers/payment/dev/simulate'
import { GET as usageAiGET, POST as usageAiPOST } from './handlers/usage/ai'
import { POST as mcpProxyPOST } from './handlers/mcp/proxy'
import { jsonResponse } from './http'

export type ApiRouteHandler = (
  req: Request,
  ctx?: { params: Record<string, string> },
) => Promise<Response> | Response

type RouteEntry = {
  method: string
  match: (pathname: string) => Record<string, string> | null
  handler: ApiRouteHandler
}

const routes: RouteEntry[] = [
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
    match: (p) =>
      p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/providers' && p !== '/api/auth/oauth/sync'
        ? {}
        : null,
    handler: oauthCatchAllGET,
  },
  {
    method: 'POST',
    match: (p) =>
      p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/sync' ? {} : null,
    handler: oauthCatchAllPOST,
  },
  { method: 'GET', match: (p) => (p === '/api/workspaces' ? {} : null), handler: workspacesGET },
  { method: 'POST', match: (p) => (p === '/api/workspaces' ? {} : null), handler: workspacesPOST },
  { method: 'GET', match: (p) => (p === '/api/subscription' ? {} : null), handler: subscriptionGET },
  { method: 'GET', match: (p) => (p === '/api/subscription/plans' ? {} : null), handler: subscriptionPlansGET },
  {
    method: 'GET',
    match: (p) => (p === '/api/subscription/payment-methods' ? {} : null),
    handler: paymentMethodsGET,
  },
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
  { method: 'POST', match: (p) => (p === '/api/mcp/proxy' ? {} : null), handler: mcpProxyPOST },
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
  {
    method: 'GET',
    match: (p) => {
      if (!p.startsWith('/api/auth/')) return null
      const handled = [
        '/api/auth/session',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/callback/credentials',
        '/api/auth/signout',
        '/api/auth/oauth/providers',
        '/api/auth/oauth/sync',
      ]
      if (handled.includes(p) || p.startsWith('/api/auth/oauth/')) return null
      return {}
    },
    handler: authCatchAllGET,
  },
]

export async function dispatchApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname
  const method = request.method.toUpperCase()

  const route = routes.find((r) => r.method === method && r.match(pathname))
  if (!route) {
    return jsonResponse({ error: 'Not found' }, 404)
  }

  const params = route.match(pathname) ?? {}
  return route.handler(request, { params })
}
