import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'
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
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [onlyFailures, setOnlyFailures] = useState(false)
  const [groupByServer, setGroupByServer] = useState(true)
  if (entries.length === 0) return null

  const visibleEntries = useMemo(() => filterMcpEntries(entries, onlyFailures), [entries, onlyFailures])

  const renderEntry = (entry: McpToolLogEntry, index: number, showServer = false) => (
    <div key={`${entry.serverId}-${entry.tool}-${index}`} className="mcp-log-entry">
      <div className="mcp-log-entry__head">
        [{entry.ok ? t('mcp.log.statusOk') : t('mcp.log.statusError')}]
        {showServer ? ` ${entry.serverName} / ` : ' '}
        {entry.tool}
      </div>
      <pre className="mcp-log-entry__pre">{entry.output}</pre>
    </div>
  )

  return (
    <div className="mcp-log-panel">
      <button type="button" className="mcp-log-panel__toggle" onClick={() => setCollapsed((v) => !v)}>
        <span>{t('mcp.log.title', { count: entries.length })}</span>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>
      {!collapsed ? (
        <div className="mcp-log-panel__body">
          <div className="mcp-log-panel__filters">
            <label className="mcp-log-panel__filter-label">
              <input type="checkbox" checked={onlyFailures} onChange={(e) => setOnlyFailures(e.target.checked)} />
              {t('mcp.log.onlyFailures')}
            </label>
            <label className="mcp-log-panel__filter-label">
              <input type="checkbox" checked={groupByServer} onChange={(e) => setGroupByServer(e.target.checked)} />
              {t('mcp.log.groupByServer')}
            </label>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="mcp-log-panel__empty">{t('mcp.log.empty')}</div>
          ) : groupByServer ? (
            Object.entries(groupMcpEntriesByServer(visibleEntries)).map(([serverName, group]) => (
              <div key={serverName} className="mcp-log-group">
                <div className="mcp-log-group__title">{serverName}</div>
                {group.map((entry, index) => renderEntry(entry, index))}
              </div>
            ))
          ) : (
            visibleEntries.map((entry, index) => renderEntry(entry, index, true))
          )}
        </div>
      ) : null}
    </div>
  )
}
