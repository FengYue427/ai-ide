/**
 * Single API router for Vercel Hobby (≤12 Serverless Functions).
 * Handlers are loaded on demand so heavy deps (alipay-sdk, stripe, etc.) do not
 * run on every cold start (e.g. GET /api/health).
 */
export type ApiRouteHandler = (
  req: Request,
  ctx?: { params: Record<string, string> },
) => Promise<Response> | Response

type HandlerModule = Record<string, ApiRouteHandler | undefined>

type RouteEntry = {
  method: string
  match: (pathname: string) => Record<string, string> | null
  load: () => Promise<HandlerModule>
  export: string
}

const routes: RouteEntry[] = [
  { method: 'GET', match: (p) => (p === '/api/health' ? {} : null), load: () => import('./handlers/health'), export: 'GET' },
  { method: 'GET', match: (p) => (p === '/api/auth/session' ? {} : null), load: () => import('./handlers/auth/session'), export: 'GET' },
  { method: 'POST', match: (p) => (p === '/api/auth/register' ? {} : null), load: () => import('./handlers/auth/register'), export: 'POST' },
  { method: 'POST', match: (p) => (p === '/api/auth/forgot-password' ? {} : null), load: () => import('./handlers/auth/forgot-password'), export: 'POST' },
  {
    method: 'POST',
    match: (p) => (p === '/api/auth/callback/credentials' ? {} : null),
    load: () => import('./handlers/auth/callback/credentials'),
    export: 'POST',
  },
  { method: 'POST', match: (p) => (p === '/api/auth/signout' ? {} : null), load: () => import('./handlers/auth/signout'), export: 'POST' },
  { method: 'GET', match: (p) => (p === '/api/auth/signout' ? {} : null), load: () => import('./handlers/auth/signout'), export: 'GET' },
  {
    method: 'GET',
    match: (p) => (p === '/api/auth/oauth/providers' ? {} : null),
    load: () => import('./handlers/auth/oauth/providers'),
    export: 'GET',
  },
  { method: 'POST', match: (p) => (p === '/api/auth/oauth/sync' ? {} : null), load: () => import('./handlers/auth/oauth/sync'), export: 'POST' },
  {
    method: 'GET',
    match: (p) =>
      p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/providers' && p !== '/api/auth/oauth/sync'
        ? {}
        : null,
    load: () => import('./handlers/auth/oauth/catchAll'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) =>
      p.startsWith('/api/auth/oauth/') && p !== '/api/auth/oauth/sync' ? {} : null,
    load: () => import('./handlers/auth/oauth/catchAll'),
    export: 'POST',
  },
  { method: 'GET', match: (p) => (p === '/api/workspaces' ? {} : null), load: () => import('./handlers/workspaces/index'), export: 'GET' },
  { method: 'POST', match: (p) => (p === '/api/workspaces' ? {} : null), load: () => import('./handlers/workspaces/index'), export: 'POST' },
  { method: 'GET', match: (p) => (p === '/api/subscription' ? {} : null), load: () => import('./handlers/subscription/index'), export: 'GET' },
  { method: 'GET', match: (p) => (p === '/api/subscription/plans' ? {} : null), load: () => import('./handlers/subscription/plans'), export: 'GET' },
  {
    method: 'GET',
    match: (p) => (p === '/api/subscription/payment-methods' ? {} : null),
    load: () => import('./handlers/subscription/payment-methods'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/payment/alipay/notify' ? {} : null),
    load: () => import('./handlers/payment/alipay/notify'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/payment/alipay/return' ? {} : null),
    load: () => import('./handlers/payment/alipay/return'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/payment/wechat/notify' ? {} : null),
    load: () => import('./handlers/payment/wechat/notify'),
    export: 'POST',
  },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/payment\/orders\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/payment/orders/byId'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/payment/dev/simulate' ? {} : null),
    load: () => import('./handlers/payment/dev/simulate'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/subscription/checkout' ? {} : null),
    load: () => import('./handlers/subscription/checkout'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/subscription/webhook' ? {} : null),
    load: () => import('./handlers/subscription/webhook'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/subscription/cancel' ? {} : null),
    load: () => import('./handlers/subscription/cancel'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/subscription/portal' ? {} : null),
    load: () => import('./handlers/subscription/portal'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/subscription/resume' ? {} : null),
    load: () => import('./handlers/subscription/resume'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/billing/expire-subscriptions' ? {} : null),
    load: () => import('./handlers/billing/expire-subscriptions'),
    export: 'POST',
  },
  {
    method: 'GET',
    match: (p) => (p === '/api/billing/expire-subscriptions' ? {} : null),
    load: () => import('./handlers/billing/expire-subscriptions'),
    export: 'GET',
  },
  { method: 'GET', match: (p) => (p === '/api/usage/ai' ? {} : null), load: () => import('./handlers/usage/ai'), export: 'GET' },
  { method: 'POST', match: (p) => (p === '/api/usage/ai' ? {} : null), load: () => import('./handlers/usage/ai'), export: 'POST' },
  {
    method: 'GET',
    match: (p) => (p === '/api/usage/dashboard' ? {} : null),
    load: () => import('./handlers/usage/dashboard'),
    export: 'GET',
  },
  { method: 'POST', match: (p) => (p === '/api/ai/chat' ? {} : null), load: () => import('./handlers/ai/chat'), export: 'POST' },
  { method: 'POST', match: (p) => (p === '/api/mcp/proxy' ? {} : null), load: () => import('./handlers/mcp/proxy'), export: 'POST' },
  {
    method: 'GET',
    match: (p) => (p === '/api/plugins/publish/reviews' ? {} : null),
    load: () => import('./handlers/plugins/publishReviews'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/plugins/publish' ? {} : null),
    load: () => import('./handlers/plugins/publish'),
    export: 'POST',
  },
  { method: 'GET', match: (p) => (p === '/api/jobs' ? {} : null), load: () => import('./handlers/jobs/index'), export: 'GET' },
  { method: 'POST', match: (p) => (p === '/api/jobs' ? {} : null), load: () => import('./handlers/jobs/index'), export: 'POST' },
  {
    method: 'POST',
    match: (p) => (p === '/api/jobs/batch' ? {} : null),
    load: () => import('./handlers/jobs/batch'),
    export: 'POST',
  },
  {
    method: 'GET',
    match: (p) => (p === '/api/jobs/process' ? {} : null),
    load: () => import('./handlers/jobs/process'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) => (p === '/api/jobs/process' ? {} : null),
    load: () => import('./handlers/jobs/process'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => {
      const m = p.match(/^\/api\/jobs\/([^/]+)\/cancel$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/jobs/cancel'),
    export: 'POST',
  },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/jobs\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/jobs/byId'),
    export: 'GET',
  },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/workspaces/byId'),
    export: 'GET',
  },
  {
    method: 'PUT',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/workspaces/byId'),
    export: 'PUT',
  },
  {
    method: 'DELETE',
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/workspaces/byId'),
    export: 'DELETE',
  },
  { method: 'GET', match: (p) => (p === '/api/collab/rooms' ? {} : null), load: () => import('./handlers/collab/rooms/index'), export: 'GET' },
  { method: 'POST', match: (p) => (p === '/api/collab/rooms' ? {} : null), load: () => import('./handlers/collab/rooms/index'), export: 'POST' },
  {
    method: 'GET',
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)$/)
      return m ? { code: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/collab/rooms/byCode'),
    export: 'GET',
  },
  {
    method: 'POST',
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)$/)
      return m ? { code: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/collab/rooms/byCode'),
    export: 'POST',
  },
  {
    method: 'POST',
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/leave$/)
      return m ? { code: decodeURIComponent(m[1]) } : null
    },
    load: () => import('./handlers/collab/rooms/leave'),
    export: 'POST',
  },
  {
    method: 'PATCH',
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/members\/([^/]+)$/)
      return m ? { code: decodeURIComponent(m[1]), userId: decodeURIComponent(m[2]) } : null
    },
    load: () => import('./handlers/collab/rooms/member'),
    export: 'PATCH',
  },
  {
    method: 'POST',
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/members\/([^/]+)\/kick$/)
      return m
        ? { code: decodeURIComponent(m[1]), userId: decodeURIComponent(m[2]) }
        : null
    },
    load: () => import('./handlers/collab/rooms/kick'),
    export: 'POST',
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
    load: () => import('./handlers/auth/authCatchAll'),
    export: 'GET',
  },
]

export async function dispatchApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname
  const method = request.method.toUpperCase()

  const route = routes.find((r) => r.method === method && r.match(pathname))
  if (!route) {
    const { localizedErrorResponse } = await import('./localizedError')
    return localizedErrorResponse(request, 'api.notFound', 404)
  }

  const mod = await route.load()
  const handler = mod[route.export]
  if (!handler) {
    const { localizedErrorResponse } = await import('./localizedError')
    return localizedErrorResponse(request, 'api.handlerNotFound', 500)
  }

  const params = route.match(pathname) ?? {}
  return handler(request, { params })
}
