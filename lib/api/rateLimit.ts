/**
 * In-memory fixed-window rate limiter for serverless / local API routes.
 * Resets on cold start in production — sufficient as a first-line abuse guard.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanupExpired(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown'
}

export interface RateLimitOptions {
  /** Namespace, e.g. `auth:register` */
  key: string
  limit: number
  windowMs: number
  /** Optional extra discriminator (user id, email hash) */
  suffix?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSec: number
}

export function checkRateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  cleanupExpired(now)

  const ip = getClientIp(req)
  const bucketKey = `${options.key}:${ip}${options.suffix ? `:${options.suffix}` : ''}`
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      retryAfterSec: 0,
    }
  }

  if (existing.count >= options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      retryAfterSec,
    }
  }

  existing.count += 1
  return {
    allowed: true,
    limit: options.limit,
    remaining: options.limit - existing.count,
    retryAfterSec: 0,
  }
}

export function resolveRateLimitOptions(
  kind: 'auth:register' | 'auth:login' | 'auth:forgot' | 'usage:ai' | 'workspaces:write',
): RateLimitOptions {
  const defaults: Record<string, RateLimitOptions> = {
    'auth:register': { key: 'auth:register', limit: 5, windowMs: 15 * 60_000 },
    'auth:login': { key: 'auth:login', limit: 20, windowMs: 15 * 60_000 },
    'auth:forgot': { key: 'auth:forgot', limit: 5, windowMs: 60 * 60_000 },
    'usage:ai': { key: 'usage:ai', limit: 120, windowMs: 60_000 },
    'workspaces:write': { key: 'workspaces:write', limit: 60, windowMs: 60_000 },
  }
  return defaults[kind]
}
