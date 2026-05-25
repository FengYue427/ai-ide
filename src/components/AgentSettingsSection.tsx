import React, { useCallback, useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import { Toggle } from './ui/Toggle'
import {
  DEFAULT_AGENT_SETTINGS,
  loadAgentSettings,
  saveAgentSettings,
  type AgentSettings,
} from '../services/agentSettingsService'

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
}

interface AgentSettingsSectionProps {
  onRegisterPersist: (persist: () => Promise<void>) => void
}

export function AgentSettingsSection({ onRegisterPersist }: AgentSettingsSectionProps) {
  const { t } = useI18n()
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_AGENT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadAgentSettings().then((loaded) => {
      setSettings(loaded)
      setLoading(false)
    })
  }, [])

  const persist = useCallback(async () => {
    await saveAgentSettings(settings)
  }, [settings])

  useEffect(() => {
    onRegisterPersist(persist)
  }, [onRegisterPersist, persist])

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('agent.settings.loading')}</div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <Zap size={18} />
        <div>
          <div style={{ fontWeight: 700 }}>{t('agent.settings.title')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('agent.settings.desc')}
          </div>
        </div>
      </div>

      <div className="settings-card settings-card--row" style={{ marginBottom: '10px', padding: 0, border: 'none' }}>
        <div>
          <div className="settings-row-title">{t('agent.settings.useTools')}</div>
          <div className="settings-row-desc">{t('agent.settings.useToolsDesc')}</div>
        </div>
        <Toggle
          checked={settings.useToolLoop}
          onChange={() => setSettings((s) => ({ ...s, useToolLoop: !s.useToolLoop }))}
          aria-label={t('agent.settings.useTools')}
        />
      </div>

      <div className="settings-card settings-card--row" style={{ marginBottom: '10px', padding: 0, border: 'none' }}>
        <div>
          <div className="settings-row-title">{t('agent.settings.autoApply')}</div>
          <div className="settings-row-desc">{t('agent.settings.autoApplyDesc')}</div>
        </div>
        <Toggle
          checked={settings.autoApplyWrites}
          onChange={() => setSettings((s) => ({ ...s, autoApplyWrites: !s.autoApplyWrites }))}
          aria-label={t('agent.settings.autoApply')}
        />
      </div>

      <label style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
        <span style={{ fontWeight: 600 }}>{t('agent.settings.maxRounds')}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t('agent.settings.maxRoundsDesc')}</span>
        <input
          type="number"
          min={1}
          max={16}
          value={settings.maxRounds}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              maxRounds: Math.min(16, Math.max(1, Number(e.target.value) || 10)),
            }))
          }
          style={{
            width: '80px',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        />
      </label>
    </div>
  )
}
