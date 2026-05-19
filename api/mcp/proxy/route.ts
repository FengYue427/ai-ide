/**
 * POST /api/mcp/proxy — forward JSON-RPC to a remote Streamable HTTP MCP server (CORS bypass).
 */
import { errorResponse, jsonResponse } from '../../../lib/api/http'
import { validateMcpProxyUrl } from '../../../lib/api/mcpProxy'

export async function POST(request: Request) {
  let body: {
    url?: string
    headers?: Record<string, string>
    message?: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> }
  }

  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const url = body.url?.trim()
  const message = body.message
  if (!url || !message?.method) {
    return errorResponse('url and message.method are required', 400)
  }

  try {
    validateMcpProxyUrl(url)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Invalid URL', 400)
  }

  const upstreamHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'MCP-Protocol-Version': '2024-11-05',
    ...(body.headers ?? {}),
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(30_000),
    })

    const text = await upstream.text()
    if (!upstream.ok) {
      return errorResponse(text || `Upstream MCP error (${upstream.status})`, upstream.status)
    }

    try {
      return jsonResponse(JSON.parse(text))
    } catch {
      return jsonResponse({ raw: text })
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'MCP proxy failed'
    return errorResponse(messageText, 502)
  }
}
