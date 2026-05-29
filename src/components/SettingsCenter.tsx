import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgentSettingsSection } from './AgentSettingsSection'
import { McpSettingsSection } from './McpSettingsSection'
import { ProjectRulesSection } from './ProjectRulesSection'
import { ProjectTasksSection } from './ProjectTasksSection'
import { SpecsSection } from './SpecsSection'
import { PlansSection } from './PlansSection'
import { ReportsSection } from './ReportsSection'
import { McpToolsBrowser } from './McpToolsBrowser'
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
import { modelOptions, modelProviderTranslationKey, type AIModel, type QuotaCheck } from '../services/aiService'
import { BILLING_SYNC_EVENT } from '../hooks/useBillingSync'
import { fetchAIQuota } from '../services/usageService'
import { useI18n, type Language } from '../i18n'
import {
  getTabCompletionMaxLines,
  isTabCompletionEnabled,
  MAX_TAB_MAX_LINES,
  MIN_TAB_MAX_LINES,
  setTabCompletionEnabled,
  setTabCompletionMaxLines,
} from '../lib/inlineCompletionPrefs'
import { isSemanticSearchEnabled, setSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { canUseEmbeddings } from '../services/embeddingService'
import { projectIndexManager } from '../services/projectIndexManager'
import { getPayloadBudget, toKb } from '../services/payloadBudget'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore, type AIConfigState } from '../store/ideStore'
import type { ProjectTaskItem } from '../services/projectTasksService'
import type { PlanCatalogItem } from '../services/planCatalogService'
import type { ReportCatalogItem } from '../services/reportCatalogService'

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
  onEditProjectTasks?: () => void
  projectTasks?: ProjectTaskItem[]
  onCreateSpec?: (name: string, language: Language) => void
  onOpenSpecsRoot?: () => void
  specTasks?: Array<{ path: string; text: string; done: boolean; line: number }>
  onMarkSpecTaskDone?: (path: string, line: number) => void
  onRunSpecTask?: (path: string, text: string) => void
  planItems?: PlanCatalogItem[]
  specTaskPaths?: string[]
  onOpenPlan?: (path: string) => void
  onRunPlan?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onMapPlanToSpec?: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  onMapPlanToSpecAndRun?: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  onDeletePlan?: (path: string) => void
  reportItems?: ReportCatalogItem[]
  onOpenReport?: (path: string) => void
  onDeleteReport?: (path: string) => void
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
  onClearLocalData,
  onResetDefaults,
  onEditProjectRules,
  projectRulesPreview = null,
  onEditProjectTasks,
  projectTasks = [],
  onCreateSpec,
  onOpenSpecsRoot,
  specTasks = [],
  onMarkSpecTaskDone,
  onRunSpecTask,
  planItems = [],
  specTaskPaths = [],
  onOpenPlan,
  onRunPlan,
  onMapPlanToSpec,
  onMapPlanToSpecAndRun,
  onDeletePlan,
  reportItems = [],
  onOpenReport,
  onDeleteReport,
  onClose,
}) => {
  const { t } = useI18n()
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
  const persistAgentRef = useRef<(() => Promise<void>) | null>(null)
  const [semanticSearchEnabled, setSemanticSearchEnabledState] = useState(isSemanticSearchEnabled)
  const [tabCompletionEnabled, setTabCompletionEnabledState] = useState(isTabCompletionEnabled)
  const [tabMaxLines, setTabMaxLines] = useState(getTabCompletionMaxLines)

  const tabs = useMemo(
    () =>
      [
        { id: 'ai' as const, label: t('settings.tab.ai'), description: t('settings.tab.ai.desc'), icon: <Bot size={18} /> },
        {
          id: 'appearance' as const,
          label: t('settings.tab.appearance'),
          description: t('settings.tab.appearance.desc'),
          icon: <Palette size={18} />,
        },
        {
          id: 'editor' as const,
          label: t('settings.tab.editor'),
          description: t('settings.tab.editor.desc'),
          icon: <Code2 size={18} />,
        },
        {
          id: 'features' as const,
          label: t('settings.tab.features'),
          description: t('settings.tab.features.desc'),
          icon: <Puzzle size={18} />,
        },
        {
          id: 'advanced' as const,
          label: t('settings.tab.advanced'),
          description: t('settings.tab.advanced.desc'),
          icon: <Cog size={18} />,
        },
      ],
    [t],
  )

  const featureList = useMemo(
    () =>
      [
        {
          name: t('settings.feature.review.title'),
          desc: t('settings.feature.review.desc'),
          label: t('settings.badge.enabled') as string,
          badge: 'enabled' as const,
        },
        {
          name: t('settings.feature.completion.title'),
          desc: t('settings.feature.completion.desc'),
          label: t('settings.badge.enabled'),
          badge: 'enabled' as const,
        },
        {
          name: t('settings.feature.collab.title'),
          desc: t('settings.feature.collab.desc'),
          label: t('settings.badge.beta'),
          badge: 'beta' as const,
        },
        {
          name: t('settings.feature.perf.title'),
          desc: t('settings.feature.perf.desc'),
          label: t('settings.badge.enabled'),
          badge: 'enabled' as const,
        },
        {
          name: t('settings.feature.mcp.title'),
          desc: t('settings.feature.mcp.desc'),
          label: t('settings.badge.experimental'),
          badge: 'experimental' as const,
        },
      ],
    [t],
  )

  const activeMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab, tabs])

  const [indexStats, setIndexStats] = useState(projectIndexManager.getIndexStats())
  const [indexBuildState, setIndexBuildState] = useState(projectIndexManager.getBuildState())

  useEffect(() => {
    return projectIndexManager.subscribe(() => {
      setIndexStats(projectIndexManager.getIndexStats())
      setIndexBuildState(projectIndexManager.getBuildState())
    })
  }, [])

  const semanticEmbeddingAvailable = useMemo(
    () => canUseEmbeddings({ provider: aiConfig.provider, apiKey: aiConfig.apiKey, endpoint: aiConfig.endpoint }),
    [aiConfig.apiKey, aiConfig.endpoint, aiConfig.provider],
  )

  const payloadBudgetKb = useMemo(() => toKb(getPayloadBudget(localAIConfig.provider)), [localAIConfig.provider])

  const indexStatusText = useMemo(() => {
    if (indexBuildState.status === 'building') {
      return indexBuildState.progress
        ? t('chat.indexBuildingProgress', {
            indexed: indexBuildState.progress.indexed,
            total: indexBuildState.progress.total,
          })
        : t('chat.indexBuilding')
    }

    if (indexBuildState.status === 'error') {
      return t('chat.indexError', { message: indexBuildState.lastError ?? '' })
    }

    if (indexStats.capped) {
      return t('chat.indexCapped', {
        indexed: indexStats.indexedFiles,
        eligible: indexStats.eligibleFiles,
      })
    }

    return t('chat.indexOk', { count: indexStats.indexedFiles })
  }, [indexBuildState.lastError, indexBuildState.progress, indexBuildState.status, indexStats.capped, indexStats.eligibleFiles, indexStats.indexedFiles, t])

  const refreshQuota = useCallback(() => {
    void fetchAIQuota(currentPlan, !!currentUser).then(setQuota)
  }, [currentPlan, currentUser])

  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  useEffect(() => {
    const onBillingSync = () => refreshQuota()
    window.addEventListener(BILLING_SYNC_EVENT, onBillingSync)
    return () => window.removeEventListener(BILLING_SYNC_EVENT, onBillingSync)
  }, [refreshQuota])

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
      await persistAgentRef.current?.()
      setSemanticSearchEnabled(semanticSearchEnabled)
      setTabCompletionEnabled(tabCompletionEnabled)
      setTabCompletionMaxLines(tabMaxLines)
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
              {t('settings.kicker')}
            </div>
            <h2 className="settings-sidebar__title">{t('settings.sidebar.title')}</h2>
            <p className="settings-sidebar__desc">{t('settings.sidebar.desc')}</p>
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
              <div className="settings-header__kicker">{t('settings.section.current')}</div>
              <h3 className="settings-header__title">{activeMeta.label}</h3>
              <p className="settings-header__desc">{activeMeta.description}</p>
            </div>
            <button type="button" className="settings-close-btn" onClick={onClose} aria-label={t('settings.close')}>
              <X size={18} />
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'ai' && (
              <>
                <QuotaIndicator quota={quota} showPlan compact={false} />

                <div className="settings-card settings-card--grid">
                  <div className="settings-field">
                    <label className="settings-label">{t('settings.ai.provider')}</label>
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
                      {(Object.keys(modelOptions) as AIModel[]).map((provider) => (
                        <option key={provider} value={provider}>
                          {t(modelProviderTranslationKey(provider, 'name'))}
                        </option>
                      ))}
                    </select>
                    <p className="settings-privacy-text">{t(modelProviderTranslationKey(localAIConfig.provider, 'desc'))}</p>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">{t('settings.ai.apiKey')}</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={localAIConfig.apiKey}
                      onChange={(event) => setLocalAIConfig({ ...localAIConfig, apiKey: event.target.value })}
                      placeholder={t('settings.ai.keyPlaceholder')}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">{t('settings.ai.model')}</label>
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
                      <label className="settings-label">{t('settings.ai.endpoint')}</label>
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
                    <strong>{t('settings.ai.privacy')}</strong>
                  </div>
                  <p className="settings-privacy-text">
                    {t('settings.ai.privacyText')}
                    {!currentUser && t('settings.ai.privacyGuest')}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="settings-card settings-card--grid">
                  <div className="settings-label">{t('settings.theme')}</div>
                  <div className="settings-grid-2">
                    {[
                      {
                        value: 'light' as const,
                        label: t('settings.theme.light'),
                        desc: t('settings.theme.lightDesc'),
                        swatch: 'light' as const,
                      },
                      {
                        value: 'vs-dark' as const,
                        label: t('settings.theme.dark'),
                        desc: t('settings.theme.darkDesc'),
                        swatch: 'dark' as const,
                      },
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
                  <div className="settings-label">{t('settings.uiLanguage')}</div>
                  <div className="settings-grid-2">
                    {[
                      { value: 'zh-CN' as const, label: t('settings.lang.zh') },
                      { value: 'en-US' as const, label: t('settings.lang.en') },
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
                    <div className="settings-row-title">{t('settings.autosave')}</div>
                    <div className="settings-row-desc">{t('settings.autosave.desc')}</div>
                  </div>
                  <Toggle
                    checked={localAutoSave}
                    onChange={() => setLocalAutoSave((value) => !value)}
                    aria-label={t('settings.autosave.aria')}
                  />
                </div>

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.tabCompletion.title')}</div>
                    <div className="settings-row-desc">{t('settings.tabCompletion.desc')}</div>
                  </div>
                  <Toggle
                    checked={tabCompletionEnabled}
                    onChange={() => setTabCompletionEnabledState((v) => !v)}
                    aria-label={t('settings.tabCompletion.title')}
                  />
                </div>

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.tabCompletion.maxLines')}</div>
                    <div className="settings-row-desc">{t('settings.tabCompletion.maxLinesDesc')}</div>
                  </div>
                  <input
                    type="number"
                    min={MIN_TAB_MAX_LINES}
                    max={MAX_TAB_MAX_LINES}
                    value={tabMaxLines}
                    disabled={!tabCompletionEnabled}
                    onChange={(e) =>
                      setTabMaxLines(
                        Math.min(
                          MAX_TAB_MAX_LINES,
                          Math.max(MIN_TAB_MAX_LINES, Number(e.target.value) || MIN_TAB_MAX_LINES),
                        ),
                      )
                    }
                    style={{
                      width: '64px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="settings-card settings-card--grid">
                  <div className="settings-row-title">{t('settings.editorPrefs')}</div>
                  <div className="settings-row-desc">{t('settings.editorPrefs.desc')}</div>
                </div>
              </>
            )}

            {activeTab === 'features' && (
              <div className="settings-features">
                <div className="settings-card settings-card--grid">
                  <div className="settings-row-title">{t('settings.features.noticeTitle')}</div>
                  <div className="settings-row-desc">{t('settings.features.noticeDesc')}</div>
                </div>
                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.feature.semantic.title')}</div>
                    <div className="settings-row-desc">{t('settings.feature.semantic.desc')}</div>
                    {!semanticEmbeddingAvailable ? (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {t('settings.semantic.onboarding.needKey')}
                      </div>
                    ) : !semanticSearchEnabled ? (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {t('settings.semantic.onboarding.enableHint')}
                      </div>
                    ) : null}
                  </div>
                  <Toggle
                    checked={semanticSearchEnabled}
                    disabled={!semanticEmbeddingAvailable}
                    onChange={() => {
                      if (!semanticEmbeddingAvailable) return
                      setSemanticSearchEnabledState((value) => !value)
                    }}
                    aria-label={t('settings.feature.semantic.title')}
                  />
                </div>

                <div className="settings-card settings-card--row" style={{ marginTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="settings-row-title">{t('settings.index.card.title')}</div>
                    <div className="settings-row-desc">{t('settings.index.card.desc')}</div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {indexStatusText}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', justifyContent: 'center' }}>
                    {indexBuildState.status === 'error' ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          const files = workspaceContextService.getAllFiles().map((f) => ({
                            name: f.path,
                            content: f.content,
                            language: f.language,
                          }))
                          projectIndexManager.forceRebuildFromWorkspace(files)
                        }}
                      >
                        {t('settings.index.retry')}
                      </button>
                    ) : null}
                    <a
                      href="https://github.com/FengYue427/ai-ide/blob/main/docs/BROWSER_LIMITATIONS.md#capacity-limits"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: 'var(--accent-color)' }}
                    >
                      {t('settings.index.limitLinkLabel')}
                    </a>
                  </div>
                </div>

                <div className="settings-card settings-card--row settings-card--payload">
                  <div style={{ flex: 1 }}>
                    <div className="settings-row-title">{t('settings.payload.card.title')}</div>
                    <div className="settings-row-desc">{t('settings.payload.card.desc')}</div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {t('settings.payload.card.providerBudget', {
                        provider: t(modelProviderTranslationKey(localAIConfig.provider, 'name')),
                        budgetKb: payloadBudgetKb,
                      })}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {t('settings.payload.card.strategy')}
                    </div>
                  </div>
                  <span className="settings-badge settings-badge--experimental">413 Guard</span>
                </div>
                {featureList.map((feature) => (
                  <div key={feature.name} className="settings-card settings-card--row">
                    <div>
                      <div className="settings-row-title">{feature.name}</div>
                      <div className="settings-row-desc">{feature.desc}</div>
                    </div>
                    <span
                      className={`settings-badge ${
                        feature.badge === 'experimental' || feature.badge === 'beta'
                          ? 'settings-badge--experimental'
                          : 'settings-badge--enabled'
                      }`}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
                {onEditProjectRules ? (
                  <ProjectRulesSection rulesPreview={projectRulesPreview} onEditRules={onEditProjectRules} />
                ) : null}
                {onEditProjectTasks ? (
                  <ProjectTasksSection tasks={projectTasks} onEditTasks={onEditProjectTasks} />
                ) : null}
                {onCreateSpec && onOpenSpecsRoot && onMarkSpecTaskDone && onRunSpecTask ? (
                  <SpecsSection
                    language={localLanguage}
                    onCreateSpec={onCreateSpec}
                    onOpenSpecsRoot={onOpenSpecsRoot}
                    tasks={specTasks}
                    onMarkTaskDone={onMarkSpecTaskDone}
                    onRunTask={onRunSpecTask}
                  />
                ) : null}
                {onOpenPlan && onRunPlan && onMapPlanToSpec && onMapPlanToSpecAndRun && onDeletePlan ? (
                  <PlansSection
                    plans={planItems}
                    specTaskPaths={specTaskPaths}
                    onOpenPlan={onOpenPlan}
                    onRunPlan={onRunPlan}
                    onMapPlanToSpec={onMapPlanToSpec}
                    onMapPlanToSpecAndRun={onMapPlanToSpecAndRun}
                    onDeletePlan={onDeletePlan}
                  />
                ) : null}
                {onOpenReport && onDeleteReport ? (
                  <ReportsSection reports={reportItems} onOpenReport={onOpenReport} onDeleteReport={onDeleteReport} />
                ) : null}
                <AgentSettingsSection onRegisterPersist={(persist) => { persistAgentRef.current = persist }} />
                <McpSettingsSection onRegisterPersist={(persist) => { persistMcpRef.current = persist }} />
                <McpToolsBrowser />
              </div>
            )}

            {activeTab === 'advanced' && (
              <>
                <div className="settings-card settings-card--grid">
                  <div className="settings-row-title">{t('settings.network.title')}</div>
                  <p className="settings-row-desc">{t('settings.network.desc')}</p>
                </div>

                <div className="settings-card settings-card--danger settings-card--grid">
                  <div className="settings-danger-title">{t('settings.advanced.caution')}</div>
                  <p className="settings-row-desc">{t('settings.advanced.cautionDesc')}</p>
                  <div className="settings-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={onClearLocalData}>
                      <Database size={14} style={{ marginRight: '6px' }} />
                      {t('settings.advanced.clear')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onResetDefaults}>
                      {t('settings.advanced.reset')}
                    </button>
                  </div>
                </div>

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.advanced.experimental')}</div>
                    <div className="settings-row-desc">{t('settings.advanced.experimentalDesc')}</div>
                  </div>
                  <span className="settings-badge settings-badge--muted">{t('settings.badge.comingSoon')}</span>
                </div>
              </>
            )}
          </div>

          <div className="settings-footer">
            <div className="settings-footer__hint">{t('settings.footer.hint')}</div>
            <div className="settings-footer__actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleSave} className="btn btn-primary">
                <Save size={16} style={{ marginRight: '6px' }} />
                {t('settings.saveChanges')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsCenter
