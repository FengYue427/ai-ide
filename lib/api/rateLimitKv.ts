import type { RateLimitOptions, RateLimitResult } from './rateLimit'
import { checkRateLimit } from './rateLimit'

type KvEnv = { url: string; token: string }

function resolveKvEnv(): KvEnv | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    ''
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    ''

  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

function bucketKeyForWindow(key: string, windowMs: number, now: number): string {
  const windowId = Math.floor(now / windowMs)
  return `ratelimit:${key}:${windowId}`
}

async function upstashPipeline(
  env: KvEnv,
  commands: Array<Array<string | number>>,
): Promise<Array<{ result?: unknown; error?: string }>> {
  const res = await fetch(`${env.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) {
    throw new Error(`KV HTTP ${res.status}`)
  }

  const json = (await res.json()) as Array<{ result?: unknown; error?: string }>
  return json
}

async function checkRateLimitKv(
  env: KvEnv,
  bucketKey: string,
  windowMs: number,
): Promise<{ count: number; ttlMs: number }> {
  // Use fixed-window key + EXPIRE NX-like behavior when supported.
  // If PEXPIRE ... NX is not supported, we fall back to resetting expiry (slightly sliding).
  const commandsNx: Array<Array<string | number>> = [
    ['INCR', bucketKey],
    ['PEXPIRE', bucketKey, windowMs, 'NX'],
    ['PTTL', bucketKey],
  ]

  try {
    const r = await upstashPipeline(env, commandsNx)
    const incr = Number(r[0]?.result ?? 0)
    const ttl = Number(r[2]?.result ?? -1)
    return { count: incr, ttlMs: ttl }
  } catch {
    const r = await upstashPipeline(env, [
      ['INCR', bucketKey],
      ['PEXPIRE', bucketKey, windowMs],
      ['PTTL', bucketKey],
    ])
    const incr = Number(r[0]?.result ?? 0)
    const ttl = Number(r[2]?.result ?? -1)
    return { count: incr, ttlMs: ttl }
  }
}

export interface DistributedRateLimitOptions extends RateLimitOptions {
  /** When true, skip KV and use in-memory limiter only. */
  disableKv?: boolean
}

/**
 * Best-effort distributed rate limiter:
 * - Uses Vercel KV / Upstash Redis REST when env is present.
 * - Falls back to the in-memory limiter when KV is unavailable.
 */
export async function checkRateLimitDistributed(
  req: Request,
  options: DistributedRateLimitOptions,
): Promise<RateLimitResult> {
  const env = !options.disableKv ? resolveKvEnv() : null
  if (!env) {
    return checkRateLimit(req, options)
  }

  const now = Date.now()
  const key = bucketKeyForWindow(options.key, options.windowMs, now)

  // Include same discriminators as in-memory version (ip + optional suffix)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || 'unknown'
  const discriminator = `${ip}${options.suffix ? `:${options.suffix}` : ''}`
  const bucketKey = `${key}:${discriminator}`

  try {
    const { count, ttlMs } = await checkRateLimitKv(env, bucketKey, options.windowMs)
    const remaining = Math.max(0, options.limit - count)
    const retryAfterSec = remaining > 0 ? 0 : Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : options.windowMs) / 1000))
    return {
      allowed: count <= options.limit,
      limit: options.limit,
      remaining,
      retryAfterSec,
    }
  } catch (error) {
    console.warn('[rateLimitKv] fallback to memory:', error instanceof Error ? error.message : error)
    return checkRateLimit(req, options)
  }
}

