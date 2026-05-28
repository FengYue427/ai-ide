import { useEffect, useMemo, useState } from 'react'
import { callMcpTool, listMcpTools } from '../services/mcpClientService'
import { getEnabledMcpServers } from '../services/mcpConfigService'
import type { McpServerConfig, McpToolDefinition } from '../services/mcpTypes'

type ToolMap = Record<string, McpToolDefinition[]>

export function McpToolsBrowser() {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [toolsByServer, setToolsByServer] = useState<ToolMap>({})
  const [loading, setLoading] = useState(false)
  const [serverId, setServerId] = useState('')
  const [toolName, setToolName] = useState('')
  const [jsonArgs, setJsonArgs] = useState('{}')
  const [result, setResult] = useState('')

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const enabled = await getEnabledMcpServers()
      setServers(enabled)
      const next: ToolMap = {}
      for (const server of enabled) {
        try {
          next[server.id] = await listMcpTools(server)
        } catch {
          next[server.id] = []
        }
      }
      setToolsByServer(next)
      if (enabled[0]) setServerId(enabled[0].id)
      setLoading(false)
    })()
  }, [])

  const activeServer = useMemo(() => servers.find((item) => item.id === serverId), [servers, serverId])
  const activeTools = useMemo(() => (serverId ? toolsByServer[serverId] ?? [] : []), [serverId, toolsByServer])

  useEffect(() => {
    if (!activeTools.length) return
    if (!toolName || !activeTools.some((tool) => tool.name === toolName)) {
      setToolName(activeTools[0].name)
    }
  }, [activeTools, toolName])

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">MCP 工具浏览器</div>
      <div className="settings-row-desc">按 Schema 手动调用 MCP 工具，验证接入和返回结构。</div>
      {loading ? <div className="settings-row-desc">加载中...</div> : null}
      {!loading && servers.length === 0 ? <div className="settings-row-desc">暂无已启用 MCP Server。</div> : null}
      {servers.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="settings-select" style={{ minWidth: 220 }} value={serverId} onChange={(e) => setServerId(e.target.value)}>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
            <select className="settings-select" style={{ minWidth: 240 }} value={toolName} onChange={(e) => setToolName(e.target.value)}>
              {activeTools.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="settings-input"
            style={{ minHeight: 100, fontFamily: 'var(--font-mono, monospace)' }}
            value={jsonArgs}
            onChange={(e) => setJsonArgs(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                if (!activeServer || !toolName) return
                try {
                  const args = jsonArgs.trim() ? (JSON.parse(jsonArgs) as Record<string, unknown>) : {}
                  const output = await callMcpTool(activeServer, toolName, args)
                  setResult(JSON.stringify(output, null, 2))
                } catch (error) {
                  setResult(error instanceof Error ? error.message : String(error))
                }
              }}
            >
              调用工具
            </button>
          </div>
          {toolName ? (
            <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>
              {JSON.stringify(activeTools.find((tool) => tool.name === toolName)?.inputSchema ?? {}, null, 2)}
            </pre>
          ) : null}
          {result ? (
            <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto', fontSize: 12, color: 'var(--text-primary)' }}>{result}</pre>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
