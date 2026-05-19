export interface McpServerConfig {
  id: string
  name: string
  /** Streamable HTTP MCP endpoint (browser uses /api/mcp/proxy). */
  url: string
  enabled: boolean
  headers?: Record<string, string>
}

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface McpJsonRpcRequest {
  jsonrpc: '2.0'
  id: number | string
  method: string
  params?: Record<string, unknown>
}

export interface McpJsonRpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number | string
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

export interface McpToolCallRequest {
  serverId: string
  tool: string
  arguments?: Record<string, unknown>
}
