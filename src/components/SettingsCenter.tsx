import React, { useState } from 'react'
import { X, Bot, Palette, Keyboard, Save, Globe, Puzzle, Shield, Code2, Database, Cog } from 'lucide-react'
import type { AIModel } from '../services/aiService'

interface SettingsCenterProps {
  aiConfig: {
    provider: AIModel
    apiKey: string
    model: string
    endpoint: string
  }
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
  language: string
  onSaveAIConfig: (config: any) => void
  onToggleTheme: () => void
  onToggleAutoSave: () => void
  onChangeLanguage: (lang: string) => void
  onClose: () => void
}

type SettingTab = 'ai' | 'appearance' | 'editor' | 'features' | 'advanced'

const SettingsCenter: React.FC<SettingsCenterProps> = ({
  aiConfig,
  theme,
  autoSaveEnabled,
  language,
  onSaveAIConfig,
  onToggleTheme,
  onToggleAutoSave,
  onChangeLanguage,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('ai')
  const [localAIConfig, setLocalAIConfig] = useState(aiConfig)
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const [localTheme, setLocalTheme] = useState(theme)
  const [localLanguage, setLocalLanguage] = useState(language)

  const handleSave = () => {
    onSaveAIConfig(localAIConfig)
    if (localAutoSave !== autoSaveEnabled) onToggleAutoSave()
    if (localTheme !== theme) onToggleTheme()
    if (localLanguage !== language) onChangeLanguage(localLanguage)
    onClose()
  }

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ai', label: 'AI 设置', icon: <Bot size={18} /> },
    { id: 'appearance', label: '外观', icon: <Palette size={18} /> },
    { id: 'editor', label: '编辑器', icon: <Code2 size={18} /> },
    { id: 'features', label: '功能', icon: <Puzzle size={18} /> },
    { id: 'advanced', label: '高级', icon: <Cog size={18} /> }
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '200px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 0'
          }}
        >
          <div
            style={{
              padding: '0 16px 16px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>设置中心</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              配置您的 IDE
            </p>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${activeTab === tab.id ? 'var(--accent-color)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                    AI 提供商
                  </label>
                  <select
                    value={localAIConfig.provider}
                    onChange={(e) => setLocalAIConfig({ ...localAIConfig, provider: e.target.value as AIModel })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="claude">Claude</option>
                    <option value="ollama">Ollama (本地)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={localAIConfig.apiKey}
                    onChange={(e) => setLocalAIConfig({ ...localAIConfig, apiKey: e.target.value })}
                    placeholder="输入您的 API Key"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                    模型
                  </label>
                  <input
                    type="text"
                    value={localAIConfig.model}
                    onChange={(e) => setLocalAIConfig({ ...localAIConfig, model: e.target.value })}
                    placeholder="gpt-4o-mini, deepseek-chat, etc."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {localAIConfig.provider === 'ollama' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                      本地端点
                    </label>
                    <input
                      type="text"
                      value={localAIConfig.endpoint}
                      onChange={(e) => setLocalAIConfig({ ...localAIConfig, endpoint: e.target.value })}
                      placeholder="http://localhost:11434"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={16} style={{ color: '#10b981' }} />
                    <strong>隐私说明</strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    API Key 仅保存在浏览器本地存储中，不会发送到任何第三方服务器。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 500 }}>
                    主题
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setLocalTheme('light')}
                      style={{
                        flex: 1,
                        padding: '20px',
                        borderRadius: '8px',
                        border: `2px solid ${localTheme === 'light' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', margin: '0 auto 8px', borderRadius: '50%', background: '#f0f0f0' }} />
                      <div style={{ color: '#333', fontSize: '13px' }}>亮色</div>
                    </button>
                    <button
                      onClick={() => setLocalTheme('vs-dark')}
                      style={{
                        flex: 1,
                        padding: '20px',
                        borderRadius: '8px',
                        border: `2px solid ${localTheme === 'vs-dark' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: '#1e1e1e',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', margin: '0 auto 8px', borderRadius: '50%', background: '#2d2d2d' }} />
                      <div style={{ color: '#fff', fontSize: '13px' }}>暗色</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 500 }}>
                    界面语言
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setLocalLanguage('zh')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '8px',
                        border: `2px solid ${localLanguage === 'zh' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <Globe size={18} />
                      <span>简体中文</span>
                    </button>
                    <button
                      onClick={() => setLocalLanguage('en')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '8px',
                        border: `2px solid ${localLanguage === 'en' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <Globe size={18} />
                      <span>English</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>自动保存</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      自动保存代码更改到本地存储
                    </div>
                  </div>
                  <button
                    onClick={() => setLocalAutoSave(!localAutoSave)}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      background: localAutoSave ? '#10b981' : 'var(--bg-tertiary)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '2px',
                        left: localAutoSave ? '24px' : '2px',
                        transition: 'left 0.2s'
                      }}
                    />
                  </button>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '8px' }}>字体大小</div>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    defaultValue="14"
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span>12px</span>
                    <span>16px</span>
                    <span>20px</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: '代码审查', desc: 'AI 驱动的代码质量分析', enabled: true },
                  { name: '智能补全', desc: 'AI 代码自动补全', enabled: true },
                  { name: '实时协作', desc: '多人同时编辑', enabled: false },
                  { name: '性能分析', desc: '代码执行性能追踪', enabled: true }
                ].map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>{feature.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{feature.desc}</div>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: feature.enabled ? '#10b98120' : 'var(--bg-tertiary)',
                        color: feature.enabled ? '#10b981' : 'var(--text-secondary)'
                      }}
                    >
                      {feature.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '8px', color: '#ef4444' }}>危险区域</div>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    以下操作不可逆，请谨慎操作。
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-danger" style={{ fontSize: '13px' }}>
                      <Database size={14} style={{ marginRight: '6px' }} />
                      清除所有数据
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '13px' }}>
                      重置设置
                    </button>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '8px' }}>实验性功能</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" id="experimental" />
                    <label htmlFor="experimental" style={{ fontSize: '13px' }}>
                      启用实验性功能（可能不稳定）
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save size={16} style={{ marginRight: '6px' }} />
              保存更改
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsCenter
