import { describe, expect, it } from 'vitest'
import { appendMcpToolsToPrompt, extractMcpToolCalls } from './mcpAgentBridge'

describe('mcpAgentBridge', () => {
  it('extracts tool call blocks', () => {
    const content = `Done.

<<<mcp-tool>>>
{"serverId":"s1","tool":"search","arguments":{"q":"auth"}}
<<<\/mcp-tool>>>
`
    const calls = extractMcpToolCalls(content)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.tool).toBe('search')
  })

  it('appends mcp section to prompt', () => {
    const merged = appendMcpToolsToPrompt('base', '\n## MCP\n')
    expect(merged).toContain('base')
    expect(merged).toContain('MCP')
  })

  it('extracts json fenced tool calls', () => {
    const content = '```json\n{"serverId":"s1","tool":"search","arguments":{}}\n```'
    const calls = extractMcpToolCalls(content)
    expect(calls[0]?.tool).toBe('search')
  })
})
