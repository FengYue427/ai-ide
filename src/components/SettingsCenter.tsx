import React, { useMemo, useRef, useState } from 'react'
import { McpSettingsSection } from './McpSettingsSection'
import { ProjectRulesSection } from './ProjectRulesSection'
import {
  Bot,
  Check,
  Cog,
  Code2,
  Database,
  Globe,
  Palette,
  Puzzle,
  Save,
  Shield,
  X,
} from 'lucide-react'
import { modelOptions, type AIModel } from '../services/aiService'

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
  onClearLocalData?: () => void
  onResetDefaults?: () => void
  onEditProjectRules?: () => void
  projectRulesPreview?: string | null
  onClose: () => void
}

type SettingTab = 'ai' | 'appearance' | 'editor' | 'features' | 'advanced'

const tabs: { id: SettingTab; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'ai', label: 'AI 设置', description: '模型、Key 与接入方式', icon: <Bot size={18} /> },
  { id: 'appearance', label: '外观', description: '主题和界面语言', icon: <Palette size={18} /> },
  { id: 'editor', label: '编辑器', description: '保存行为与书写习惯', icon: <Code2 size={18} /> },
  { id: 'features', label: '功能', description: '当前能力与扩展状态', icon: <Puzzle size={18} /> },
  { id: 'advanced', label: '高级', description: '实验功能与重置操作', icon: <Cog size={18} /> },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
}

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
}

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) => (
  <button
    onClick={onChange}
    type="button"
    style={{
      width: '52px',
      height: '30px',
      borderRadius: '999px',
      border: '1px solid transparent',
      background: checked ? 'var(--accent-color)' : 'var(--bg-tertiary)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '25px' : '3px',
        width: '22px',
        height: '22px',
        borderRadius: '999px',
        background: '#fff',
        transition: 'left 0.2s ease',
      }}
    />
  </button>
)

const SettingsCenter: React.FC<SettingsCenterProps> = ({
  aiConfig,
  theme,
  autoSaveEnabled,
  language,
  onSaveAIConfig,
  onToggleTheme,
  onToggleAutoSave,
  onChangeLanguage,
  onClearLocalData,
  onResetDefaults,
  onEditProjectRules,
  projectRulesPreview = null,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('ai')
  const [localAIConfig, setLocalAIConfig] = useState(aiConfig)
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const [localTheme, setLocalTheme] = useState(theme)
  const [localLanguage, setLocalLanguage] = useState(language)
  const persistMcpRef = useRef<(() => Promise<void>) | null>(null)

  const activeMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab])

  const handleSave = () => {
    void (async () => {
      onSaveAIConfig(localAIConfig)
      if (localAutoSave !== autoSaveEnabled) onToggleAutoSave()
      if (localTheme !== theme) onToggleTheme()
      if (localLanguage !== language) onChangeLanguage(localLanguage)
      await persistMcpRef.current?.()
      onClose()
    })()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 8, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-panel)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <aside
          style={{
            borderRight: '1px solid var(--border-color)',
            background:
              'radial-gradient(circle at top left, rgba(124,156,255,0.14), transparent 30%), color-mix(in srgb, var(--bg-secondary) 94%, transparent)',
            padding: '24px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ padding: '6px 10px 14px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-color) 24%, var(--border-color))',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
              }}
            >
              <Cog size={14} />
              Settings Center
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', lineHeight: 1.15 }}>把环境调成你顺手的样子</h2>
            <p style={{ margin: '10px 0 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              这里集中管理模型接入、主题、语言、自动保存和实验能力。
            </p>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 14px',
                  borderRadius: '16px',
                  border:
                    activeTab === tab.id
                      ? '1px solid color-mix(in srgb, var(--accent-color) 34%, var(--border-color))'
                      : '1px solid transparent',
                  background:
                    activeTab === tab.id
                      ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 16%, transparent), transparent 80%)'
                      : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr',
                  gap: '12px',
                  alignItems: 'start',
                }}
              >
                <span style={{ marginTop: '2px' }}>{tab.icon}</span>
                <span>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>
                    {tab.label}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', lineHeight: 1.5 }}>{tab.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              padding: '22px 24px 18px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
                当前分区
              </div>
              <h3 style={{ margin: 0, fontSize: '22px' }}>{activeMeta.label}</h3>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {activeMeta.description}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'grid', gap: '18px' }}>
            {activeTab === 'ai' && (
              <>
                <div style={{ ...cardStyle, display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700 }}>AI 提供商</label>
                    <select
                      value={localAIConfig.provider}
                      onChange={(event) => {
                        const provider = event.target.value as AIModel
                        setLocalAIConfig({
                          ...localAIConfig,
                          provider,
                          model: modelOptions[provider].models[0],
                        })
                      }}
                      style={inputStyle}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="claude">Claude</option>
                      <option value="google">Google Gemini</option>
                      <option value="qwen">阿里通义千问</option>
                      <option value="zhipu">智谱 GLM</option>
                      <option value="minimax">MiniMax</option>
                      <option value="grok">xAI Grok</option>
                      <option value="ollama">Ollama（本地）</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700 }}>API Key</label>
                    <input
                      type="password"
                      value={localAIConfig.apiKey}
                      onChange={(event) => setLocalAIConfig({ ...localAIConfig, apiKey: event.target.value })}
                      placeholder="输入你的 API Key"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700 }}>模型</label>
                    <select
                      value={localAIConfig.model}
                      onChange={(event) => setLocalAIConfig({ ...localAIConfig, model: event.target.value })}
                      style={inputStyle}
                    >
                      {modelOptions[localAIConfig.provider].models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {localAIConfig.provider === 'ollama' && (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700 }}>本地端点</label>
                      <input
                        type="text"
                        value={localAIConfig.endpoint}
                        onChange={(event) => setLocalAIConfig({ ...localAIConfig, endpoint: event.target.value })}
                        placeholder="http://localhost:11434"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>

                <div style={{ ...cardStyle, display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={16} color="var(--success-color)" />
                    <strong>隐私说明</strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                    API Key 保存在浏览器本地。除你选择的模型服务外，应用不会额外转发到其他第三方服务。
                  </p>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div style={{ ...cardStyle, display: 'grid', gap: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>主题</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                    {[
                      { value: 'light' as const, label: '浅色', desc: '更适合白天与文档阅读', swatch: '#f3f6fd' },
                      { value: 'vs-dark' as const, label: '深色', desc: '更聚焦代码与夜间工作', swatch: '#10192b' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLocalTheme(option.value)}
                        style={{
                          ...cardStyle,
                          padding: '16px',
                          cursor: 'pointer',
                          border:
                            localTheme === option.value
                              ? '1px solid color-mix(in srgb, var(--accent-color) 40%, var(--border-color))'
                              : '1px solid var(--border-color)',
                          background: localTheme === option.value ? 'color-mix(in srgb, var(--accent-color) 10%, var(--bg-secondary))' : 'var(--bg-secondary)',
                        }}
                      >
                        <div
                          style={{
                            height: '72px',
                            borderRadius: '12px',
                            marginBottom: '12px',
                            background: option.swatch,
                            border: '1px solid rgba(0,0,0,0.08)',
                          }}
                        />
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{option.label}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ ...cardStyle, display: 'grid', gap: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>界面语言</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                    {[
                      { value: 'zh', label: '简体中文' },
                      { value: 'en', label: 'English' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLocalLanguage(option.value)}
                        style={{
                          ...cardStyle,
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: localLanguage === option.value ? 'color-mix(in srgb, var(--accent-color) 10%, var(--bg-secondary))' : 'var(--bg-secondary)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Globe size={18} />
                          <span style={{ fontWeight: 700 }}>{option.label}</span>
                        </div>
                        {localLanguage === option.value && <Check size={18} color="var(--accent-color)" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'editor' && (
              <>
                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>自动保存</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      在你编辑代码时自动保存到本地与工作区状态，减少误关页面带来的损失。
                    </div>
                  </div>
                  <Toggle checked={localAutoSave} onChange={() => setLocalAutoSave((value) => !value)} />
                </div>

                <div style={{ ...cardStyle, display: 'grid', gap: '12px' }}>
                  <div style={{ fontWeight: 700 }}>编辑偏好</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    当前版本先保留简洁设置，把最常用的自动保存、主题和语言收在一处。后续适合继续补充字体、缩进与格式化策略。
                  </div>
                </div>
              </>
            )}

            {activeTab === 'features' && (
              <div style={{ display: 'grid', gap: '14px' }}>
                {[
                  { name: '代码审查', desc: 'AI 驱动的质量分析与建议', enabled: true, label: '已启用' },
                  { name: '智能补全', desc: '辅助生成和补全常见代码片段', enabled: true, label: '已启用' },
                  { name: '实时协作', desc: '实验性房间与在线用户（不同步编辑器）', enabled: true, label: '实验性' },
                  { name: '性能分析', desc: '查看运行输出和性能趋势', enabled: true, label: '已启用' },
                  { name: 'MCP 工具', desc: 'Agent 可调用外部 Streamable HTTP MCP', enabled: true, label: '实验性' },
                ].map((feature) => (
                  <div key={feature.name} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{feature.name}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{feature.desc}</div>
                    </div>
                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: feature.label === '实验性'
                          ? 'color-mix(in srgb, var(--warning-color, #f59e0b) 14%, transparent)'
                          : feature.enabled
                            ? 'color-mix(in srgb, var(--success-color) 14%, transparent)'
                            : 'var(--bg-tertiary)',
                        color: feature.label === '实验性'
                          ? '#f59e0b'
                          : feature.enabled
                            ? 'var(--success-color)'
                            : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {feature.label ?? (feature.enabled ? '已启用' : '规划中')}
                    </span>
                  </div>
                ))}
                {onEditProjectRules ? (
                  <ProjectRulesSection rulesPreview={projectRulesPreview} onEditRules={onEditProjectRules} />
                ) : null}
                <McpSettingsSection onRegisterPersist={(persist) => { persistMcpRef.current = persist }} />
              </div>
            )}

            {activeTab === 'advanced' && (
              <>
                <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--danger-color) 36%, var(--border-color))' }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger-color)', marginBottom: '8px' }}>谨慎操作</div>
                  <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    清理本地缓存或恢复默认编辑器设置。不会影响 Neon 云端账号与工作区。
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClearLocalData}>
                      <Database size={14} style={{ marginRight: '6px' }} />
                      清理本地数据
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onResetDefaults}>
                      重置默认设置
                    </button>
                  </div>
                </div>

                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>实验功能</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      为后续迭代预留的入口。等功能成熟后再开放实际开关。
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    暂未开放
                  </span>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              padding: '18px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>保存后立即应用到当前工作区。</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">
                取消
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={16} style={{ marginRight: '6px' }} />
                保存更改
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsCenter
