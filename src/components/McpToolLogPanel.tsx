import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { McpToolLogEntry } from '../services/mcpAgentBridge'

interface McpToolLogPanelProps {
  entries: McpToolLogEntry[]
}

export function filterMcpEntries(entries: McpToolLogEntry[], onlyFailures: boolean): McpToolLogEntry[] {
  return onlyFailures ? entries.filter((e) => !e.ok) : entries
}

export function groupMcpEntriesByServer(entries: McpToolLogEntry[]): Record<string, McpToolLogEntry[]> {
  return entries.reduce<Record<string, McpToolLogEntry[]>>((acc, entry) => {
    if (!acc[entry.serverName]) acc[entry.serverName] = []
    acc[entry.serverName].push(entry)
    return acc
  }, {})
}

export function McpToolLogPanel({ entries }: McpToolLogPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [onlyFailures, setOnlyFailures] = useState(false)
  const [groupByServer, setGroupByServer] = useState(true)
  if (entries.length === 0) return null

  const visibleEntries = useMemo(() => filterMcpEntries(entries, onlyFailures), [entries, onlyFailures])

  return (
    <div
      style={{
        marginTop: '10px',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        background: 'color-mix(in srgb, var(--bg-primary) 92%, transparent)',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: 'none',
          background: 'none',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <span>MCP 结构化结果（{entries.length}）</span>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>
      {!collapsed ? (
        <div style={{ padding: '0 10px 10px', display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={onlyFailures} onChange={(e) => setOnlyFailures(e.target.checked)} />
              仅失败
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={groupByServer} onChange={(e) => setGroupByServer(e.target.checked)} />
              按 Server 分组
            </label>
          </div>

          {visibleEntries.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>无可显示条目。</div>
          ) : groupByServer ? (
            Object.entries(groupMcpEntriesByServer(visibleEntries)).map(([serverName, group]) => {
              return (
                <div key={serverName} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{serverName}</div>
                  {group.map((entry, index) => (
                    <div
                      key={`${entry.serverId}-${entry.tool}-${index}`}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        [{entry.ok ? 'OK' : 'ERROR'}] {entry.tool}
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          maxHeight: '100px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {entry.output}
                      </pre>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            visibleEntries.map((entry, index) => (
              <div
                key={`${entry.serverId}-${entry.tool}-${index}`}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  [{entry.ok ? 'OK' : 'ERROR'}] {entry.serverName} / {entry.tool}
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    maxHeight: '100px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {entry.output}
                </pre>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
