import React, { useEffect, useMemo, useRef, useState } from 'react'
import { McpSettingsSection } from './McpSettingsSection'
import { ProjectRulesSection } from './ProjectRulesSection'
import { QuotaIndicator } from './ui/QuotaIndicator'
import { Toggle } from './ui/Toggle'
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
import { modelOptions, type AIModel, type QuotaCheck } from '../services/aiService'
import { fetchAIQuota } from '../services/usageService'
import type { Language } from '../i18n'
import { useIDEStore, type AIConfigState } from '../store/ideStore'

interface SettingsCenterProps {
  aiConfig: AIConfigState
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
  language: Language
  onSaveAIConfig: (config: AIConfigState) => void
  onToggleTheme: () => void
  onToggleAutoSave: () => void
  onChangeLanguage: (lang: Language) => void
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

const featureList = [
  { name: '代码审查', desc: 'AI 驱动的质量分析与建议', enabled: true, label: '已启用' as const },
  { name: '智能补全', desc: '辅助生成和补全常见代码片段', enabled: true, label: '已启用' as const },
  { name: '实时协作', desc: 'Yjs + WebRTC 房间同步（Beta，非生产级 OT）', enabled: true, label: 'Beta' as const },
  { name: '性能分析', desc: '查看运行输出和性能趋势', enabled: true, label: '已启用' as const },
  { name: 'MCP 工具', desc: 'Agent 可调用外部 Streamable HTTP MCP', enabled: true, label: '实验性' as const },
]

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
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const currentUser = useIDEStore((s) => s.currentUser)
  const [activeTab, setActiveTab] = useState<SettingTab>('ai')
  const [localAIConfig, setLocalAIConfig] = useState(aiConfig)
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const [localTheme, setLocalTheme] = useState(theme)
  const [localLanguage, setLocalLanguage] = useState(language)
  const [quota, setQuota] = useState<QuotaCheck>({
    allowed: true,
    used: 0,
    limit: 50,
    remaining: 50,
    plan: currentPlan,
  })
  const persistMcpRef = useRef<(() => Promise<void>) | null>(null)

  const activeMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab])

  useEffect(() => {
    void fetchAIQuota(currentPlan, !!currentUser).then(setQuota)
  }, [currentPlan, currentUser])

  useEffect(() => {
    setLocalAIConfig(aiConfig)
    setLocalAutoSave(autoSaveEnabled)
    setLocalTheme(theme)
    setLocalLanguage(language)
  }, [aiConfig, autoSaveEnabled, theme, language])

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
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(event) => event.stopPropagation()}>
        <aside className="settings-sidebar">
          <div className="settings-sidebar__intro">
            <div className="settings-kicker">
              <Cog size={14} />
              Settings Center
            </div>
            <h2 className="settings-sidebar__title">把环境调成你顺手的样子</h2>
            <p className="settings-sidebar__desc">这里集中管理模型接入、主题、语言、自动保存和实验能力。</p>
          </div>

          <div className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-btn ${activeTab === tab.id ? 'settings-nav-btn--active' : ''}`}
              >
                <span className="settings-nav-btn__icon">{tab.icon}</span>
                <span>
                  <span className="settings-nav-btn__label">{tab.label}</span>
                  <span className="settings-nav-btn__hint">{tab.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="settings-main">
          <div className="settings-header">
            <div>
              <div className="settings-header__kicker">当前分区</div>
              <h3 className="settings-header__title">{activeMeta.label}</h3>
              <p className="settings-header__desc">{activeMeta.description}</p>
            </div>
            <button type="button" className="settings-close-btn" onClick={onClose} aria-label="关闭设置">
              <X size={18} />
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'ai' && (
              <>
                <QuotaIndicator quota={quota} showPlan compact={false} />

                <div className="settings-card settings-card--grid">
                  <div className="settings-field">
                    <label className="settings-label">AI 提供商</label>
                    <select
                      className="settings-select"
                      value={localAIConfig.provider}
                      onChange={(event) => {
                        const provider = event.target.value as AIModel
                        setLocalAIConfig({
                          ...localAIConfig,
                          provider,
                          model: modelOptions[provider].models[0],
                        })
                      }}
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

                  <div className="settings-field">
                    <label className="settings-label">API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={localAIConfig.apiKey}
                      onChange={(event) => setLocalAIConfig({ ...localAIConfig, apiKey: event.target.value })}
                      placeholder="输入你的 API Key"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">模型</label>
                    <select
                      className="settings-select"
                      value={localAIConfig.model}
                      onChange={(event) => setLocalAIConfig({ ...localAIConfig, model: event.target.value })}
                    >
                      {modelOptions[localAIConfig.provider].models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {localAIConfig.provider === 'ollama' && (
                    <div className="settings-field">
                      <label className="settings-label">本地端点</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={localAIConfig.endpoint}
                        onChange={(event) => setLocalAIConfig({ ...localAIConfig, endpoint: event.target.value })}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                  )}
                </div>

                <div className="settings-card settings-card--grid">
                  <div className="settings-privacy-row">
                    <Shield size={16} color="var(--success-color)" />
                    <strong>隐私说明</strong>
                  </div>
                  <p className="settings-privacy-text">
                    API Key 保存在浏览器本地。除你选择的模型服务外，应用不会额外转发到其他第三方服务。
                    {!currentUser && ' 登录账号后可同步云端配额统计。'}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="settings-card settings-card--grid">
                  <div className="settings-label">主题</div>
                  <div className="settings-grid-2">
                    {[
                      { value: 'light' as const, label: '浅色', desc: '更适合白天与文档阅读', swatch: 'light' as const },
                      { value: 'vs-dark' as const, label: '深色', desc: '更聚焦代码与夜间工作', swatch: 'dark' as const },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLocalTheme(option.value)}
                        className={`settings-option-card ${localTheme === option.value ? 'settings-option-card--active' : ''}`}
                      >
                        <div className={`settings-theme-swatch settings-theme-swatch--${option.swatch}`} />
                        <div className="settings-option-card__title">{option.label}</div>
                        <div className="settings-option-card__desc">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-card settings-card--grid">
                  <div className="settings-label">界面语言</div>
                  <div className="settings-grid-2">
                    {[
                      { value: 'zh-CN' as const, label: '简体中文' },
                      { value: 'en-US' as const, label: 'English' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLocalLanguage(option.value)}
                        className={`settings-option-card settings-option-card--lang ${localLanguage === option.value ? 'settings-option-card--active' : ''}`}
                      >
                        <div className="settings-option-card__lang">
                          <Globe size={18} />
                          <span>{option.label}</span>
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
                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">自动保存</div>
                    <div className="settings-row-desc">
                      在你编辑代码时自动保存到本地与工作区状态，减少误关页面带来的损失。
                    </div>
                  </div>
                  <Toggle checked={localAutoSave} onChange={() => setLocalAutoSave((value) => !value)} aria-label="自动保存" />
                </div>

                <div className="settings-card settings-card--grid">
                  <div className="settings-row-title">编辑偏好</div>
                  <div className="settings-row-desc">
                    当前版本先保留简洁设置，把最常用的自动保存、主题和语言收在一处。后续适合继续补充字体、缩进与格式化策略。
                  </div>
                </div>
              </>
            )}

            {activeTab === 'features' && (
              <div className="settings-features">
                {featureList.map((feature) => (
                  <div key={feature.name} className="settings-card settings-card--row">
                    <div>
                      <div className="settings-row-title">{feature.name}</div>
                      <div className="settings-row-desc">{feature.desc}</div>
                    </div>
                    <span
                      className={`settings-badge ${
                        feature.label === '实验性' || feature.label === 'Beta'
                          ? 'settings-badge--experimental'
                          : feature.enabled
                            ? 'settings-badge--enabled'
                            : 'settings-badge--muted'
                      }`}
                    >
                      {feature.label}
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
                <div className="settings-card settings-card--danger settings-card--grid">
                  <div className="settings-danger-title">谨慎操作</div>
                  <p className="settings-row-desc">
                    清理本地缓存或恢复默认编辑器设置。不会影响 Neon 云端账号与工作区。
                  </p>
                  <div className="settings-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={onClearLocalData}>
                      <Database size={14} style={{ marginRight: '6px' }} />
                      清理本地数据
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onResetDefaults}>
                      重置默认设置
                    </button>
                  </div>
                </div>

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">实验功能</div>
                    <div className="settings-row-desc">为后续迭代预留的入口。等功能成熟后再开放实际开关。</div>
                  </div>
                  <span className="settings-badge settings-badge--muted">暂未开放</span>
                </div>
              </>
            )}
          </div>

          <div className="settings-footer">
            <div className="settings-footer__hint">保存后立即应用到当前工作区。</div>
            <div className="settings-footer__actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                取消
              </button>
              <button type="button" onClick={handleSave} className="btn btn-primary">
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
