export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getRequestIdFromRequest(req: Request): string | null {
  const value = req.headers.get('x-request-id')?.trim()
  return value || null
}

export function resolveRequestId(req: Request): string {
  return getRequestIdFromRequest(req) ?? createRequestId()
}

export function attachRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Request-Id', requestId)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
