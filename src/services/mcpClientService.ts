import { serviceText } from '../lib/serviceI18n'
import type { McpJsonRpcResponse, McpServerConfig, McpToolDefinition } from './mcpTypes'

const PROXY_PATH = '/api/mcp/proxy'

async function mcpRpc<T>(
  server: McpServerConfig,
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(PROXY_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: server.url.trim(),
      headers: server.headers,
      message: {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: params ?? {},
      },
    }),
  })

  const payload = (await response.json()) as McpJsonRpcResponse<T> & { error?: string | { message?: string } }

  if (!response.ok) {
    const httpError =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error && typeof payload.error === 'object' && payload.error.message
          ? payload.error.message
          : `MCP request failed (${response.status})`
    throw new Error(httpError)
  }

  if (payload.error && typeof payload.error === 'object' && payload.error.message) {
    throw new Error(payload.error.message)
  }

  if (payload.result === undefined) {
    throw new Error('MCP response missing result')
  }

  return payload.result
}

export async function pingMcpServer(server: McpServerConfig): Promise<{ ok: boolean; detail?: string }> {
  if (!server.url.trim()) {
    return { ok: false, detail: serviceText('mcp.ping.emptyUrl') }
  }

  try {
    await mcpRpc(server, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ai-ide', version: '1.0.0-rc.1' },
    })
    return { ok: true, detail: serviceText('mcp.ping.ok') }
  } catch (error) {
    try {
      const tools = await listMcpTools(server)
      return { ok: true, detail: serviceText('mcp.ping.toolsListed', { count: tools.length }) }
    } catch (inner) {
      const message = inner instanceof Error ? inner.message : serviceText('mcp.ping.fail')
      return { ok: false, detail: message }
    }
  }
}

export async function listMcpTools(server: McpServerConfig): Promise<McpToolDefinition[]> {
  const result = await mcpRpc<{ tools?: McpToolDefinition[] }>(server, 'tools/list', {})
  return result.tools ?? []
}

export async function callMcpTool(
  server: McpServerConfig,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const result = await mcpRpc<{ content?: unknown; structuredContent?: unknown }>(server, 'tools/call', {
    name: toolName,
    arguments: args,
  })
  return result.structuredContent ?? result.content ?? result
}
