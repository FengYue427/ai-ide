export function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `creq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export function getResponseRequestId(response: Response): string | null {
  return response.headers.get('x-request-id')?.trim() || null
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('X-Request-Id')) {
    headers.set('X-Request-Id', createClientRequestId())
  }
  return fetch(input, { ...init, headers })
}
