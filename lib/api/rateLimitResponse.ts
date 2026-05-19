import { errorResponse } from './http'
import type { RateLimitResult } from './rateLimit'

export function rateLimitErrorResponse(result: RateLimitResult): Response {
  return errorResponse('请求过于频繁，请稍后再试', 429, {
    'Retry-After': String(result.retryAfterSec),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  })
}
