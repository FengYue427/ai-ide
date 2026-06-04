import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgentSettingsSection } from './AgentSettingsSection'
import { McpSettingsSection } from './McpSettingsSection'
import { ProjectRulesSection } from './ProjectRulesSection'
import { ProjectTasksSection } from './ProjectTasksSection'
import { SpecCatalogSection } from './SpecCatalogSection'
import { PlansSection } from './PlansSection'
import { ReportsSection } from './ReportsSection'
import { PlanOverviewSection } from './PlanOverviewSection'
import { McpToolsBrowser } from './McpToolsBrowser'
import { PlatformAiUsageDashboard } from './PlatformAiUsageDashboard'
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
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { modelOptions, modelProviderTranslationKey, type AIModel, type QuotaCheck } from '../services/aiService'
import { BILLING_SYNC_EVENT } from '../hooks/useBillingSync'
import { fetchAIQuota } from '../services/usageService'
import { useI18n, type Language } from '../i18n'
import {
  MAX_FILE_CONTENT_LEN,
  MAX_WORKSPACE_BODY_BYTES,
  MAX_WORKSPACE_FILES,
} from '../../lib/api/workspacePayload'
import {
  getTabCompletionDebounceMs,
  getTabCompletionMaxLines,
  isTabCompletionEnabled,
  MAX_TAB_DEBOUNCE_MS,
  MAX_TAB_MAX_LINES,
  MIN_TAB_DEBOUNCE_MS,
  MIN_TAB_MAX_LINES,
  setTabCompletionDebounceMs,
  setTabCompletionEnabled,
  setTabCompletionMaxLines,
} from '../lib/inlineCompletionPrefs'
import { getTabCompletionMetrics, resetTabCompletionMetrics } from '../lib/inlineCompletionMetrics'
import { describeTabCompletionStrategy } from '../lib/tabCompletionStrategy'
import { isSemanticSearchEnabled, setSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { canUseEmbeddings } from '../services/embeddingService'
import { projectIndexManager } from '../services/projectIndexManager'
import { getPayloadBudget, toKb } from '../services/payloadBudget'
import { workspaceContextService } from '../services/workspaceContextService'
import { isAiGatewayEnabled } from '../lib/aiPlatformMode'
import { getV12FeatureStatus } from '../lib/v12Features'
import { usePlatformAiHealth } from '../hooks/usePlatformAiHealth'
import { usePlatformUsageDashboard } from '../hooks/usePlatformUsageDashboard'
import { useIDEStore, type AIConfigState, type AiKeyMode } from '../store/ideStore'
import type { ProjectTaskItem } from '../services/projectTasksService'
import type { PlanCatalogItem } from '../services/planCatalogService'
import type { PlanTemplateItem } from '../services/planTemplateService'
import type { PlanSpecLink } from '../services/planSpecLinkService'
import type { QueueRestorePreview } from '../services/queueReportRestorePreviewService'
import type { ReportCatalogItem } from '../services/reportCatalogService'
import type { SpecCatalogItem } from '../services/specCatalogService'

interface SettingsCenterProps {
  aiConfig: AIConfigState
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
  formatOnSaveEnabled: boolean
  language: Language
  onSaveAIConfig: (config: AIConfigState) => void
  onToggleTheme: () => void
  onToggleAutoSave: () => void
  onToggleFormatOnSave: () => void
  onChangeLanguage: (lang: Language) => void
  onClearLocalData?: () => void
  onResetDefaults?: () => void
  onEditProjectRules?: () => void
  projectRulesPreview?: string | null
  onEditProjectTasks?: () => void
  onOpenTasksPanel?: () => void
  projectTasks?: ProjectTaskItem[]
  onCreateSpec?: (name: string, language: Language) => void
  onOpenSpecsRoot?: () => void
  specTasks?: Array<{ path: string; text: string; done: boolean; line: number }>
  onMarkSpecTaskDone?: (path: string, line: number) => void
  onRunSpecTask?: (path: string, text: string) => void
  specCatalogItems?: SpecCatalogItem[]
  specSourceSummaries?: Record<string, string[]>
  specPlanLinks?: Record<string, PlanSpecLink[]>
  specLinkCounts?: Record<string, number>
  onOpenLinkedPlan?: (planPath: string, stepLine?: number) => void
  onSyncAideToWorkspace?: () => void
  onOpenSpecTasks?: (tasksPath: string) => void
  onOpenSpecAcceptance?: (tasksPath: string) => void
  onRunFirstOpenSpecTask?: (tasksPath: string) => void
  planItems?: PlanCatalogItem[]
  planLinkCounts?: Record<string, number>
  planTemplates?: PlanTemplateItem[]
  onCreatePlanFromTemplate?: (templateId: string, planTitle: string) => void
  planOverview?: {
    planCount: number
    openSteps: number
    planQueueCount: number
    specQueueCount: number
    isQueueRunning: boolean
    latestReportAt: string | null
  }
  specTaskPaths?: string[]
  onOpenPlan?: (path: string) => void
  onRunPlan?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onRunPlanInBackground?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onMapPlanToSpec?: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  onMapPlanToSpecAndRun?: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  getLinkedSpecPath?: (planPath: string, stepText: string) => string | null
  onOpenLinkedSpec?: (specTasksPath: string) => void
  onMarkPlanStepsDone?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onDuplicatePlan?: (path: string) => void
  onDeletePlan?: (path: string) => void
  reportItems?: ReportCatalogItem[]
  onOpenReport?: (path: string) => void
  onDeleteReport?: (path: string) => void
  onDeleteReports?: (paths: string[]) => void
  onPruneReports?: (keepRecent: number) => void
  onExportReportsZip?: (paths: string[]) => void
  getRestorePreview?: (path: string) => QueueRestorePreview | null
  onRestoreReport?: (path: string) => void
  onOpenLatestReport?: () => void
  onClose: () => void
}

type SettingTab = 'ai' | 'appearance' | 'editor' | 'features' | 'advanced'

const SettingsCenter: React.FC<SettingsCenterProps> = ({
  aiConfig,
  theme,
  autoSaveEnabled,
  formatOnSaveEnabled,
  language,
  onSaveAIConfig,
  onToggleTheme,
  onToggleAutoSave,
  onToggleFormatOnSave,
  onChangeLanguage,
  onClearLocalData,
  onResetDefaults,
  onEditProjectRules,
  projectRulesPreview = null,
  onEditProjectTasks,
  onOpenTasksPanel,
  projectTasks = [],
  onCreateSpec,
  onOpenSpecsRoot,
  specCatalogItems = [],
  specSourceSummaries = {},
  specPlanLinks = {},
  specLinkCounts = {},
  onOpenLinkedPlan,
  onSyncAideToWorkspace,
  onOpenSpecTasks,
  onOpenSpecAcceptance,
  onRunFirstOpenSpecTask,
  planItems = [],
  planLinkCounts = {},
  planTemplates = [],
  onCreatePlanFromTemplate,
  planOverview,
  specTaskPaths = [],
  onOpenPlan,
  onRunPlan,
  onRunPlanInBackground,
  onMapPlanToSpec,
  onMapPlanToSpecAndRun,
  getLinkedSpecPath,
  onOpenLinkedSpec,
  onMarkPlanStepsDone,
  onDuplicatePlan,
  onDeletePlan,
  reportItems = [],
  onOpenReport,
  onDeleteReport,
  onDeleteReports,
  onPruneReports,
  onExportReportsZip,
  getRestorePreview,
  onRestoreReport,
  onOpenLatestReport,
  onClose,
}) => {
  const planCatalogRef = useRef<HTMLDivElement>(null)
  const reportCatalogRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const currentUser = useIDEStore((s) => s.currentUser)
  const [activeTab, setActiveTab] = useState<SettingTab>('ai')
  const [localAIConfig, setLocalAIConfig] = useState(aiConfig)
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const [localFormatOnSave, setLocalFormatOnSave] = useState(formatOnSaveEnabled)
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
  const [tabDebounceMs, setTabDebounceMs] = useState(getTabCompletionDebounceMs)
  const [tabMetricsTick, setTabMetricsTick] = useState(0)
  const aiGatewayEnabled = isAiGatewayEnabled()
  const platformAiHealth = usePlatformAiHealth(aiGatewayEnabled && activeTab === 'ai')
  const showPlatformUsageDashboard = aiGatewayEnabled && Boolean(currentUser) && activeTab === 'ai'
  const platformUsageDashboard = usePlatformUsageDashboard(showPlatformUsageDashboard)

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

  const v12FeatureStatus = useMemo(() => getV12FeatureStatus(), [])

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
    setLocalFormatOnSave(formatOnSaveEnabled)
    setLocalTheme(theme)
    setLocalLanguage(language)
  }, [aiConfig, autoSaveEnabled, formatOnSaveEnabled, theme, language])

  const handleSave = () => {
    void (async () => {
      onSaveAIConfig(localAIConfig)
      if (localAutoSave !== autoSaveEnabled) onToggleAutoSave()
      if (localFormatOnSave !== formatOnSaveEnabled) onToggleFormatOnSave()
      if (localTheme !== theme) onToggleTheme()
      if (localLanguage !== language) onChangeLanguage(localLanguage)
      await persistMcpRef.current?.()
      await persistAgentRef.current?.()
      setSemanticSearchEnabled(semanticSearchEnabled)
      setTabCompletionEnabled(tabCompletionEnabled)
      setTabCompletionMaxLines(tabMaxLines)
      setTabCompletionDebounceMs(tabDebounceMs)
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

                {showPlatformUsageDashboard && platformUsageDashboard.state.status === 'ready' ? (
                  <PlatformAiUsageDashboard
                    data={platformUsageDashboard.state.data}
                    onRefresh={platformUsageDashboard.refresh}
                    refreshing={platformUsageDashboard.refreshing}
                  />
                ) : null}

                {showPlatformUsageDashboard && platformUsageDashboard.state.status === 'loading' ? (
                  <div className="settings-card settings-card--grid" data-testid="platform-usage-dashboard-loading">
                    <p className="settings-privacy-text">{t('settings.ai.usageDashboardLoading')}</p>
                  </div>
                ) : null}

                {showPlatformUsageDashboard && platformUsageDashboard.state.status === 'error' ? (
                  <div className="settings-card settings-card--row" data-testid="platform-usage-dashboard-error">
                    <p className="settings-privacy-text">{t('settings.ai.usageDashboardError')}</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={platformUsageDashboard.refresh}
                    >
                      {t('settings.ai.usageDashboardRefresh')}
                    </button>
                  </div>
                ) : null}

                {aiGatewayEnabled ? (
                  <div className="settings-card" data-testid="settings-platform-ai-health">
                    <div className="settings-privacy-row">
                      <Sparkles size={16} color="var(--accent-color)" />
                      <strong>{t('settings.ai.platformStatus')}</strong>
                    </div>
                    <p className="settings-privacy-text">
                      {platformAiHealth.status === 'loading'
                        ? t('settings.ai.platformChecking')
                        : platformAiHealth.status === 'unreachable'
                          ? t('settings.ai.platformUnreachable')
                          : platformAiHealth.configured
                            ? t('settings.ai.platformReady', {
                                provider: platformAiHealth.provider ?? '—',
                              })
                            : t('settings.ai.platformNotConfigured')}
                    </p>
                    {platformAiHealth.status === 'ready' && platformAiHealth.configured ? (
                      <div className="settings-privacy-row" style={{ marginTop: 8 }}>
                        <Zap size={14} color="var(--success-color)" />
                        <span>{t('settings.ai.platformReadyBadge')}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="settings-card settings-card--grid">
                  {aiGatewayEnabled ? (
                    <div className="settings-field">
                      <label className="settings-label">{t('settings.ai.keyMode')}</label>
                      <select
                        className="settings-select"
                        value={localAIConfig.keyMode}
                        onChange={(event) =>
                          setLocalAIConfig({
                            ...localAIConfig,
                            keyMode: event.target.value as AiKeyMode,
                          })
                        }
                      >
                        <option value="platform">{t('settings.ai.keyModePlatform')}</option>
                        <option value="byok">{t('settings.ai.keyModeByok')}</option>
                      </select>
                      <p className="settings-privacy-text">
                        {localAIConfig.keyMode === 'platform'
                          ? t('settings.ai.keyModePlatformHint')
                          : t('settings.ai.keyModeByokHint')}
                      </p>
                    </div>
                  ) : null}

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

                  {localAIConfig.keyMode !== 'platform' || !aiGatewayEnabled ? (
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
                  ) : null}

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
                      { value: 'ja-JP' as const, label: t('settings.lang.ja') },
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
                    <div className="settings-row-title">{t('settings.formatOnSave')}</div>
                    <div className="settings-row-desc">{t('settings.formatOnSave.desc')}</div>
                  </div>
                  <Toggle
                    checked={localFormatOnSave}
                    onChange={() => setLocalFormatOnSave((value) => !value)}
                    aria-label={t('settings.formatOnSave.aria')}
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

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.tabCompletion.debounce')}</div>
                    <div className="settings-row-desc">{t('settings.tabCompletion.debounceDesc')}</div>
                  </div>
                  <input
                    type="number"
                    min={MIN_TAB_DEBOUNCE_MS}
                    max={MAX_TAB_DEBOUNCE_MS}
                    step={20}
                    value={tabDebounceMs}
                    disabled={!tabCompletionEnabled}
                    onChange={(e) =>
                      setTabDebounceMs(
                        Math.min(
                          MAX_TAB_DEBOUNCE_MS,
                          Math.max(
                            MIN_TAB_DEBOUNCE_MS,
                            Number(e.target.value) || MIN_TAB_DEBOUNCE_MS,
                          ),
                        ),
                      )
                    }
                    style={{
                      width: '72px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="settings-card settings-card--grid">
                  <div className="settings-row-title">{t('settings.tabCompletion.pathTitle')}</div>
                  <div className="settings-row-desc">
                    {t(`settings.tabCompletion.path.${describeTabCompletionStrategy(localAIConfig, Boolean(currentUser))}`)}
                  </div>
                </div>

                <div className="settings-card settings-card--row">
                  <div>
                    <div className="settings-row-title">{t('settings.tabCompletion.metricsTitle')}</div>
                    <div className="settings-row-desc">
                      {(() => {
                        void tabMetricsTick
                        const m = getTabCompletionMetrics()
                        return t('settings.tabCompletion.metricsDesc', {
                          hits: String(m.cacheHits),
                          misses: String(m.cacheMisses),
                          fim: String(m.fimSuccess),
                          platform: String(m.platformSuccess),
                          chat: String(m.chatSuccess),
                          avgMs: m.avgLatencyMs != null ? String(m.avgLatencyMs) : '—',
                          last: m.lastPath ?? '—',
                        })
                      })()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      resetTabCompletionMetrics()
                      setTabMetricsTick((n) => n + 1)
                    }}
                  >
                    {t('settings.tabCompletion.metricsReset')}
                  </button>
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
                <div
                  className="settings-card settings-card--grid"
                  data-testid="settings-v12-features"
                >
                  <div className="settings-row-title">{t('settings.v12.card.title')}</div>
                  <div className="settings-row-desc">{t('settings.v12.card.desc')}</div>
                  <ul className="settings-v12-status-list" style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}>
                    <li>
                      {t('settings.v12.multiRoot')}:{' '}
                      {v12FeatureStatus.multiRoot ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
                    </li>
                    <li>
                      {t('settings.v12.virtualTree')}:{' '}
                      {v12FeatureStatus.virtualFileTree ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
                    </li>
                    <li>
                      {t('settings.v12.pluginTrust')}:{' '}
                      {v12FeatureStatus.pluginTrustMarket ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
                    </li>
                  </ul>
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
                <div className="settings-card settings-card--row">
                  <div style={{ flex: 1 }}>
                    <div className="settings-row-title">{t('settings.cloudSave.card.title')}</div>
                    <div className="settings-row-desc">
                      {t('settings.cloudSave.card.desc', {
                        maxFiles: MAX_WORKSPACE_FILES,
                        maxFileKb: Math.round(MAX_FILE_CONTENT_LEN / 1024),
                        maxBodyMb: Math.round(MAX_WORKSPACE_BODY_BYTES / 1_000_000),
                      })}
                    </div>
                  </div>
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
                  <ProjectTasksSection
                    tasks={projectTasks}
                    onEditTasks={onEditProjectTasks}
                    onOpenTasksPanel={onOpenTasksPanel}
                  />
                ) : null}
                {onCreateSpec && onOpenSpecsRoot && onOpenSpecTasks && onOpenSpecAcceptance && onRunFirstOpenSpecTask ? (
                  <SpecCatalogSection
                    language={localLanguage}
                    specs={specCatalogItems}
                    specSources={specSourceSummaries}
                    specPlanLinks={specPlanLinks}
                    specLinkCounts={specLinkCounts}
                    onOpenLinkedPlan={onOpenLinkedPlan}
                    onCreateSpec={onCreateSpec}
                    onOpenSpecsRoot={onOpenSpecsRoot}
                    onOpenSpecTasks={onOpenSpecTasks}
                    onOpenSpecAcceptance={onOpenSpecAcceptance}
                    onRunFirstOpenTask={onRunFirstOpenSpecTask}
                  />
                ) : null}
                {planOverview ? (
                  <PlanOverviewSection
                    planCount={planOverview.planCount}
                    openSteps={planOverview.openSteps}
                    planQueueCount={planOverview.planQueueCount}
                    specQueueCount={planOverview.specQueueCount}
                    isQueueRunning={planOverview.isQueueRunning}
                    latestReportAt={planOverview.latestReportAt}
                    onSyncAideToWorkspace={onSyncAideToWorkspace}
                    onOpenLatestReport={onOpenLatestReport}
                    onScrollToPlans={() => planCatalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    onScrollToReports={() =>
                      reportCatalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  />
                ) : null}
                {onOpenPlan && onRunPlan && onMapPlanToSpec && onMapPlanToSpecAndRun && onDeletePlan ? (
                  <div ref={planCatalogRef}>
                  <PlansSection
                    plans={planItems}
                    specTaskPaths={specTaskPaths}
                    planLinkCounts={planLinkCounts}
                    planTemplates={planTemplates}
                    onCreateFromTemplate={onCreatePlanFromTemplate}
                    getLinkedSpecPath={getLinkedSpecPath}
                    onOpenLinkedSpec={onOpenLinkedSpec}
                    onMarkPlanStepsDone={onMarkPlanStepsDone}
                    onDuplicatePlan={onDuplicatePlan}
                    onOpenPlan={onOpenPlan}
                    onRunPlan={onRunPlan}
                    onRunPlanInBackground={onRunPlanInBackground}
                    onMapPlanToSpec={onMapPlanToSpec}
                    onMapPlanToSpecAndRun={onMapPlanToSpecAndRun}
                    onDeletePlan={onDeletePlan}
                  />
                  </div>
                ) : null}
                {onOpenReport && onDeleteReport ? (
                  <div ref={reportCatalogRef}>
                  <ReportsSection
                    reports={reportItems}
                    onOpenReport={onOpenReport}
                    onDeleteReport={onDeleteReport}
                    getRestorePreview={getRestorePreview}
                    onDeleteReports={onDeleteReports}
                    onPruneReports={onPruneReports}
                    onExportReportsZip={onExportReportsZip}
                    onRestoreReport={onRestoreReport}
                  />
                  </div>
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
