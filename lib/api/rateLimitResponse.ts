import { localizedErrorResponse } from './localizedError'
import type { RateLimitResult } from './rateLimit'

export function rateLimitErrorResponse(req: Request, result: RateLimitResult): Response {
  return localizedErrorResponse(req, 'api.rateLimit.exceeded', 429, undefined, {
    'Retry-After': String(result.retryAfterSec),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  })
}
