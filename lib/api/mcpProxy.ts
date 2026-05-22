const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

/** RFC1918, link-local, and metadata-style hosts blocked in production SSRF guard. */
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (BLOCKED_HOSTS.has(host)) return true
  if (host === 'metadata.google.internal' || host.endsWith('.internal')) return true

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  const match172 = host.match(/^172\.(\d{1,2})\.\d{1,3}\.\d{1,3}$/)
  if (match172) {
    const second = Number(match172[1])
    if (second >= 16 && second <= 31) return true
  }
  return false
}

const BLOCKED_HEADER_NAMES = new Set([
  'host',
  'authorization',
  'cookie',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-api-key',
  'proxy-authorization',
])

export function validateMcpProxyUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid MCP URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('MCP URL must use http or https')
  }

  const allowLocal =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_MCP_LOCALHOST === 'true'

  if (!allowLocal && isBlockedHostname(parsed.hostname)) {
    throw new Error('MCP URL target is not allowed')
  }

  return parsed
}

/** Strip hop-by-hop / credential headers from client-supplied MCP proxy headers. */
export function sanitizeMcpProxyHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  if (!headers) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (BLOCKED_HEADER_NAMES.has(key.toLowerCase())) continue
    if (typeof value === 'string') out[key] = value
  }
  return out
}
