import { useCallback, useEffect, useState } from 'react'
import { Plus, Server, Trash2, Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import { MCP_OFFICIAL_PRESETS } from '../data/mcpOfficialCatalog'
import {
  createMcpServerDraft,
  createMcpServerFromPreset,
  getMcpToolCountEstimateSync,
  loadMcpServers,
  loadMcpSettings,
  refreshMcpToolCountEstimate,
  saveMcpServers,
  saveMcpSettings,
  type McpSettings,
} from '../services/mcpConfigService'
import { estimateMcpPayloadReserveBytes } from '../services/mcpPayloadReserve'
import type { McpServerConfig } from '../services/mcpTypes'
import { pingMcpServer } from '../services/mcpClientService'

interface McpSettingsSectionProps {
  onRegisterPersist: (persist: () => Promise<void>) => void
}

export function McpSettingsSection({ onRegisterPersist }: McpSettingsSectionProps) {
  const { t } = useI18n()
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [settings, setSettings] = useState<McpSettings>({ autoFollowUp: true, maxFollowUpRounds: 2 })
  const [pingStatus, setPingStatus] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [mcpToolCount, setMcpToolCount] = useState<number | undefined>(getMcpToolCountEstimateSync())

  useEffect(() => {
    void (async () => {
      const [loadedServers, loadedSettings] = await Promise.all([loadMcpServers(), loadMcpSettings()])
      setServers(loadedServers)
      setSettings(loadedSettings)
      setLoading(false)
      const count = await refreshMcpToolCountEstimate()
      setMcpToolCount(count)
    })()
  }, [])

  const persist = useCallback(async () => {
    await saveMcpServers(servers)
    await saveMcpSettings(settings)
    const count = await refreshMcpToolCountEstimate()
    setMcpToolCount(count)
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
    setPingStatus((prev) => ({ ...prev, [server.id]: t('mcp.ping.checking') }))
    const result = await pingMcpServer(server)
    setPingStatus((prev) => ({
      ...prev,
      [server.id]: result.ok ? result.detail ?? t('mcp.ping.ok') : result.detail ?? t('mcp.ping.fail'),
    }))
  }

  if (loading) {
    return (
      <div className="mcp-card">
        <div className="mcp-card__desc">{t('mcp.loading')}</div>
      </div>
    )
  }

  return (
    <div className="mcp-stack">
      <div className="mcp-card">
        <div className="mcp-card__head">
          <Server size={18} />
          <div>
            <div className="mcp-card__title">{t('mcp.title')}</div>
            <div className="mcp-card__desc">{t('mcp.desc')}</div>
            <div className="mcp-card__meta">
              {mcpToolCount == null
                ? t('mcp.toolCountUnknown')
                : t('mcp.toolCountHint', {
                    count: mcpToolCount,
                    reserveKb: Math.round(estimateMcpPayloadReserveBytes(mcpToolCount) / 1024),
                  })}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div className="mcp-section-label">{t('mcp.catalog.title')}</div>
          <div className="mcp-preset-list">
            {MCP_OFFICIAL_PRESETS.map((preset) => (
              <div key={preset.id} className="mcp-preset-row">
                <div className="mcp-preset-row__body">
                  <div className="mcp-preset-row__name">{t(preset.nameKey)}</div>
                  <div className="mcp-preset-row__desc">{t(preset.descKey)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary mcp-preset-row__btn"
                  onClick={() => {
                    setServers((prev) => [
                      ...prev,
                      createMcpServerFromPreset(preset.id, t(preset.nameKey), preset.defaultUrl),
                    ])
                  }}
                >
                  {t('mcp.catalog.add')}
                </button>
                <a href={preset.docsUrl} target="_blank" rel="noreferrer" className="mcp-preset-row__docs">
                  {t('mcp.catalog.docs')}
                </a>
              </div>
            ))}
          </div>
        </div>

        {servers.length === 0 ? (
          <div className="mcp-card__desc" style={{ marginBottom: '12px' }}>
            {t('mcp.empty')}
          </div>
        ) : null}

        <div className="mcp-server-list">
          {servers.map((server) => (
            <div key={server.id} className="mcp-server-row">
              <div className="mcp-server-row__toolbar">
                <input
                  className="settings-input mcp-server-row__name"
                  value={server.name}
                  onChange={(event) => updateServer(server.id, { name: event.target.value })}
                  placeholder={t('mcp.displayName')}
                />
                <label className="mcp-server-row__toggle">
                  <input
                    type="checkbox"
                    checked={server.enabled}
                    onChange={(event) => updateServer(server.id, { enabled: event.target.checked })}
                  />
                  {t('mcp.enabled')}
                </label>
                <button
                  type="button"
                  className="btn btn-secondary mcp-server-row__btn"
                  onClick={() => void handlePing(server)}
                >
                  {t('mcp.test')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mcp-server-row__btn"
                  onClick={() => removeServer(server.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className="settings-input"
                value={server.url}
                onChange={(event) => updateServer(server.id, { url: event.target.value })}
                placeholder="https://example.com/mcp"
              />
              {pingStatus[server.id] ? (
                <div className="mcp-server-row__ping">{pingStatus[server.id]}</div>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary mcp-add-btn"
          onClick={() => setServers((prev) => [...prev, createMcpServerDraft()])}
        >
          <Plus size={14} className="settings-icon-inline" />
          {t('mcp.add')}
        </button>
      </div>

      <div className="mcp-card">
        <div className="mcp-card__head">
          <Zap size={18} />
          <div className="mcp-card__title">{t('mcp.followUp.title')}</div>
        </div>
        <label className="mcp-followup-label">
          <input
            type="checkbox"
            checked={settings.autoFollowUp}
            onChange={(event) => setSettings((prev) => ({ ...prev, autoFollowUp: event.target.checked }))}
          />
          {t('mcp.followUp.checkbox')}
        </label>
        <label className="mcp-followup-rounds">
          <span style={{ color: 'var(--text-secondary)' }}>{t('mcp.followUp.maxRounds')}</span>
          <input
            type="number"
            min={0}
            max={5}
            className="settings-input mcp-followup-rounds__input"
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
