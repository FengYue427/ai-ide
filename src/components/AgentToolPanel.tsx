import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Wrench,
} from 'lucide-react'
import type { AgentActivityEntry } from '../services/agentRunner'
import { useI18n } from '../i18n'

interface AgentToolPanelProps {
  activity: AgentActivityEntry[]
  /** When true the panel starts collapsed */
  defaultCollapsed?: boolean
}

const TOOL_ICONS: Record<string, string> = {
  list_files: '📂',
  read_file: '📄',
  write_file: '✏️',
  move_file: '🔀',
  delete_file: '🗑️',
  create_dir: '📁',
  search_repo: '🔍',
  grep_repo: '🔎',
  run_command: '⚡',
}

function ToolRow({ entry }: { entry: AgentActivityEntry }) {
  const [open, setOpen] = useState(false)
  const icon = TOOL_ICONS[entry.tool] ?? '🔧'
  return (
    <div
      style={{
        padding: '6px 10px',
        borderRadius: '8px',
        background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)',
        marginBottom: '4px',
        border: '1px solid var(--border-color)',
        cursor: entry.detail ? 'pointer' : 'default',
      }}
      onClick={() => entry.detail && setOpen((v) => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        <span>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent-color)', minWidth: '100px' }}>
          {entry.tool}
        </span>
        <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.detail}
        </span>
        {entry.ok ? (
          <CheckCircle size={13} color="#34d399" />
        ) : (
          <XCircle size={13} color="#f87171" />
        )}
        {entry.truncated && (
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>…</span>
        )}
        {entry.hunkCount != null && entry.hunkCount > 0 && (
          <span
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              background: 'color-mix(in srgb, var(--accent-color) 20%, transparent)',
              borderRadius: '4px',
              color: 'var(--accent-color)',
            }}
          >
            +{entry.hunkCount}
          </span>
        )}
        {entry.detail && (
          <span style={{ color: 'var(--text-secondary)', marginLeft: '2px' }}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
      </div>
      {open && entry.detail && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '120px',
            overflow: 'auto',
            padding: '6px',
            background: 'var(--bg-primary)',
            borderRadius: '6px',
          }}
        >
          {entry.detail}
        </div>
      )}
    </div>
  )
}

export function AgentToolPanel({ activity, defaultCollapsed = false }: AgentToolPanelProps) {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (activity.length === 0) return null

  const failCount = activity.filter((e) => !e.ok).length

  return (
    <div
      style={{
        margin: '8px 0',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--bg-secondary) 60%, transparent)',
      }}
    >
      <button
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: 600,
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <Wrench size={14} color="var(--accent-color)" />
        <span style={{ flex: 1, textAlign: 'left' }}>
          {t('agent.toolPanel.title')} ({activity.length})
        </span>
        {failCount > 0 && (
          <span style={{ color: '#f87171', fontSize: '11px', marginRight: '4px' }}>
            {failCount} {t('agent.toolPanel.failed')}
          </span>
        )}
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>

      {!collapsed && (
        <div style={{ padding: '0 10px 10px' }}>
          {activity.map((entry, idx) => (
            <ToolRow key={`${entry.round}-${entry.tool}-${idx}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
