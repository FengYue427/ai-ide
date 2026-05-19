const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

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

  if (!allowLocal && BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('Local MCP URLs are disabled in production')
  }

  return parsed
}
