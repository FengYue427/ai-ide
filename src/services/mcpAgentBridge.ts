import { callMcpTool, listMcpTools } from './mcpClientService'
import { getEnabledMcpServers } from './mcpConfigService'
import type { McpServerConfig, McpToolCallRequest } from './mcpTypes'

const MCP_TOOL_BLOCK_RE = /<<<mcp-tool>>>\s*([\s\S]*?)\s*<<<\/mcp-tool>>>/gi
const MCP_JSON_FENCE_RE = /```(?:json)?\s*(\{[\s\S]*?"serverId"[\s\S]*?"tool"[\s\S]*?\})\s*```/gi

export async function buildMcpToolsPromptSection(): Promise<string> {
  const servers = await getEnabledMcpServers()
  if (servers.length === 0) return ''

  const sections: string[] = []

  for (const server of servers) {
    try {
      const tools = await listMcpTools(server)
      if (tools.length === 0) continue
      const lines = tools.map((tool) => {
        const schema = tool.inputSchema ? ` params=${JSON.stringify(tool.inputSchema)}` : ''
        return `- ${tool.name}: ${tool.description ?? 'no description'}${schema}`
      })
      sections.push(`Server "${server.name}" (id=${server.id}):\n${lines.join('\n')}`)
    } catch {
      sections.push(`Server "${server.name}" (id=${server.id}): [tools unavailable — check MCP URL]`)
    }
  }

  if (sections.length === 0) return ''

  return `

## MCP tools (optional)
You may call external tools by emitting a block:

<<<mcp-tool>>>
{"serverId":"<id>","tool":"<name>","arguments":{}}
<<<\/mcp-tool>>>

Available tools:
${sections.join('\n\n')}
`
}

export function appendMcpToolsToPrompt(basePrompt: string, mcpSection: string): string {
  if (!mcpSection.trim()) return basePrompt
  return `${basePrompt}\n${mcpSection}`
}

function parseToolCallJson(raw: string): McpToolCallRequest | null {
  try {
    const parsed = JSON.parse(raw.trim()) as McpToolCallRequest
    if (parsed.serverId && parsed.tool) return parsed
  } catch {
    // ignore
  }
  return null
}

export function extractMcpToolCalls(content: string): McpToolCallRequest[] {
  const calls: McpToolCallRequest[] = []
  const seen = new Set<string>()

  const pushCall = (call: McpToolCallRequest | null) => {
    if (!call) return
    const key = `${call.serverId}:${call.tool}:${JSON.stringify(call.arguments ?? {})}`
    if (seen.has(key)) return
    seen.add(key)
    calls.push(call)
  }

  for (const match of content.matchAll(MCP_TOOL_BLOCK_RE)) {
    pushCall(parseToolCallJson(match[1]))
  }
  for (const match of content.matchAll(MCP_JSON_FENCE_RE)) {
    pushCall(parseToolCallJson(match[1]))
  }

  return calls
}

function stripMcpToolMarkers(content: string): string {
  return content.replace(MCP_TOOL_BLOCK_RE, '').replace(MCP_JSON_FENCE_RE, '').trim()
}

export async function executeMcpToolCalls(
  calls: McpToolCallRequest[],
  servers: McpServerConfig[],
): Promise<string[]> {
  const results: string[] = []

  for (const call of calls) {
    const server = servers.find((item) => item.id === call.serverId)
    if (!server) {
      results.push(`[mcp] unknown serverId: ${call.serverId}`)
      continue
    }
    try {
      const output = await callMcpTool(server, call.tool, call.arguments ?? {})
      results.push(`[mcp] ${server.name}/${call.tool}: ${JSON.stringify(output).slice(0, 4000)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'tool call failed'
      results.push(`[mcp] ${server.name}/${call.tool} error: ${message}`)
    }
  }

  return results
}

export async function runMcpToolBlocksInContent(content: string): Promise<{
  content: string
  toolLog: string[]
}> {
  const servers = await getEnabledMcpServers()
  if (servers.length === 0) return { content, toolLog: [] }

  const calls = extractMcpToolCalls(content)
  if (calls.length === 0) return { content, toolLog: [] }

  const toolLog = await executeMcpToolCalls(calls, servers)
  return { content: stripMcpToolMarkers(content), toolLog }
}

export interface McpAgentTurnOptions {
  content: string
  autoFollowUp: boolean
  maxFollowUpRounds: number
  sendFollowUp: (payload: { assistantSoFar: string; toolLog: string[] }) => Promise<string>
}

/** Execute MCP blocks; optionally ask the model to continue after tool results. */
export async function processAgentMcpTurn(options: McpAgentTurnOptions): Promise<{
  content: string
  toolLog: string[]
  followUpRounds: number
}> {
  let content = options.content
  const allLogs: string[] = []
  let followUpRounds = 0

  while (true) {
    const { content: stripped, toolLog } = await runMcpToolBlocksInContent(content)
    content = stripped
    if (toolLog.length === 0) break

    allLogs.push(...toolLog)

    if (!options.autoFollowUp || followUpRounds >= options.maxFollowUpRounds) break

    followUpRounds += 1
    content = await options.sendFollowUp({ assistantSoFar: content, toolLog })
  }

  return { content, toolLog: allLogs, followUpRounds }
}
