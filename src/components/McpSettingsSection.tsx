import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Server, Trash2, Zap } from 'lucide-react'
import {
  createMcpServerDraft,
  loadMcpServers,
  loadMcpSettings,
  saveMcpServers,
  saveMcpSettings,
  type McpSettings,
} from '../services/mcpConfigService'
import type { McpServerConfig } from '../services/mcpTypes'
import { pingMcpServer } from '../services/mcpClientService'

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
}

interface McpSettingsSectionProps {
  onRegisterPersist: (persist: () => Promise<void>) => void
}

export function McpSettingsSection({ onRegisterPersist }: McpSettingsSectionProps) {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [settings, setSettings] = useState<McpSettings>({ autoFollowUp: true, maxFollowUpRounds: 2 })
  const [pingStatus, setPingStatus] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const [loadedServers, loadedSettings] = await Promise.all([loadMcpServers(), loadMcpSettings()])
      setServers(loadedServers)
      setSettings(loadedSettings)
      setLoading(false)
    })()
  }, [])

  const persist = useCallback(async () => {
    await saveMcpServers(servers)
    await saveMcpSettings(settings)
  }, [servers, settings])

  useEffect(() => {
    onRegisterPersist(persist)
  }, [onRegisterPersist, persist])

  const updateServer = (id: string, patch: Partial<McpServerConfig>) => {
    setServers((prev) => prev.map((server) => (server.id === id ? { ...server, ...patch } : server)))
  }

  const removeServer = (id: string) => {
    setServers((prev) => prev.filter((server) => server.id !== id))
  }

  const handlePing = async (server: McpServerConfig) => {
    setPingStatus((prev) => ({ ...prev, [server.id]: '检测中…' }))
    const result = await pingMcpServer(server)
    setPingStatus((prev) => ({
      ...prev,
      [server.id]: result.ok ? result.detail ?? '已连接' : result.detail ?? '连接失败',
    }))
  }

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>正在加载 MCP 配置…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Server size={18} />
          <div>
            <div style={{ fontWeight: 700 }}>MCP 服务器</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              通过 <code>/api/mcp/proxy</code> 连接 Streamable HTTP MCP。本地 URL 需 dev:stack 且允许 localhost。
            </div>
          </div>
        </div>

        {servers.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            尚未配置 MCP 服务器。添加后 Agent 可在回复中使用 <code>&lt;&lt;&lt;mcp-tool&gt;&gt;&gt;</code> 块调用工具。
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '12px' }}>
          {servers.map((server) => (
            <div
              key={server.id}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={server.name}
                  onChange={(event) => updateServer(server.id, { name: event.target.value })}
                  placeholder="显示名称"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={server.enabled}
                    onChange={(event) => updateServer(server.id, { enabled: event.target.checked })}
                  />
                  启用
                </label>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => void handlePing(server)}>
                  测试
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => removeServer(server.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                style={inputStyle}
                value={server.url}
                onChange={(event) => updateServer(server.id, { url: event.target.value })}
                placeholder="https://example.com/mcp"
              />
              {pingStatus[server.id] ? (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pingStatus[server.id]}</div>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: '12px' }}
          onClick={() => setServers((prev) => [...prev, createMcpServerDraft()])}
        >
          <Plus size={14} style={{ marginRight: '6px' }} />
          添加 MCP 服务器
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Zap size={18} />
          <div style={{ fontWeight: 700 }}>Agent 自动跟进</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={settings.autoFollowUp}
            onChange={(event) => setSettings((prev) => ({ ...prev, autoFollowUp: event.target.checked }))}
          />
          工具调用后自动发起跟进轮次（将结果反馈给模型）
        </label>
        <label style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>最大跟进轮次</span>
          <input
            type="number"
            min={0}
            max={5}
            style={{ ...inputStyle, maxWidth: '120px' }}
            value={settings.maxFollowUpRounds}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                maxFollowUpRounds: Math.min(5, Math.max(0, Number(event.target.value) || 0)),
              }))
            }
            disabled={!settings.autoFollowUp}
          />
        </label>
      </div>
    </div>
  )
}
