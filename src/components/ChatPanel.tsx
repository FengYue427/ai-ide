import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  Bot,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code2,
  FilePlus,
  FolderOpen,
  ListTodo,
  Pause,
  Send,
  Server,
  Sparkles,
  User,
  Wand2,
  Zap,
} from 'lucide-react'
import { AgentToolPanel } from './AgentToolPanel'
import { aiAgentService } from '../services/aiAgentService'
import {
  appendMcpToolsToPrompt,
  buildMcpToolsPromptSection,
  processAgentMcpTurn,
} from '../services/mcpAgentBridge'
import { getEnabledMcpServers, getMcpServersSync, getMcpToolCountEstimateSync, loadMcpServers, loadMcpSettings, refreshMcpToolCountEstimate } from '../services/mcpConfigService'
import { parseAgentFileChanges, type AgentFileChange } from '../services/agentApplyService'
import { getOldContentForPath } from '../services/fileApplyService'
import {
  extractCodeBlocks,
  generateCodePrompt,
  sendMessage,
  type AIConfig,
  type QuotaCheck,
} from '../services/aiService'
import { supportsAgentToolCalling } from '../services/agentChatCompletion'
import { appendAgentContextSections } from '../services/agentContextService'
import { DEFAULT_AGENT_SETTINGS, loadAgentSettings } from '../services/agentSettingsService'
import {
  buildAgentToolMessages,
  formatActivityForChat,
  runAgentLoop,
  type AgentActivityEntry,
} from '../services/agentRunner'
import { BILLING_SYNC_EVENT } from '../hooks/useBillingSync'
import { fetchAIQuota } from '../services/usageService'
import { workspaceContextService } from '../services/workspaceContextService'
import { QuotaIndicator } from './ui/QuotaIndicator'
import { getActiveMentionQuery, insertMention } from '../lib/mentionQuery'
import { buildMentionContextSection } from '../services/mentionContextService'
import {
  appendProjectRules,
  collectRulesSources,
  extractProjectRules,
} from '../services/projectRulesService'
import {
  appendOpenTasksToPrompt,
  collectTasksSources,
  extractProjectTasks,
} from '../services/projectTasksService'
import type { ToastKind } from './FeedbackCenter'
import { projectIndexManager } from '../services/projectIndexManager'
import type { IndexSearchHit } from '../services/projectIndexService'
import { canUseEmbeddings } from '../services/embeddingService'
import { isSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { buildSemanticContextSection } from '../services/semanticSearchService'
import { collectSearchableFiles } from '../services/searchService'
import { ChatMessageBody } from './ChatMessageBody'
import { ChatMessageActions } from './ChatMessageActions'
import { McpToolLogPanel } from './McpToolLogPanel'
import { formatChatErrorMessage } from '../services/chatErrorMessages'
import { useI18n } from '../i18n'
import { trackEvent } from '../lib/observability'
import { ChatPayloadBudgetMeter } from './ChatPayloadBudgetMeter'
import { estimateChatPayload, measureAiMessagesPayload } from '../services/chatPayloadEstimate'
import {
  applyPayloadMeterReserve,
  comparePayloadEstimateToSend,
  evaluateSendMentionGate,
} from '../services/chatSendPreflight'
import { getLargeRepoContextHint, shouldShowLargeRepoHint } from '../services/largeRepoContextHint'
import {
  countAmbiguousMentions,
  countUnresolvedMentions,
  runMentionPreflight,
} from '../services/mentionPreflight'
import { getPayloadBudget, toKb } from '../services/payloadBudget'
import { isAiConfigured, isAiGatewayEnabled } from '../lib/aiPlatformMode'
import { useIDEStore } from '../store/ideStore'
import { appendSpecsContext, collectSpecSources } from '../services/specsService'
import { loadAgentRunHistory, saveAgentRunHistoryItem } from '../services/agentRunHistoryService'
import type { McpToolLogEntry } from '../services/mcpAgentBridge'
import {
  createInitialChatSessionState,
  enqueueSend,
  shiftQueue,
  startRun,
  type ChatSessionStatus,
  type PendingSend,
} from '../services/chatSessionOrchestrator'
import { buildSpecExecutionLog } from '../services/specExecutionLog'
import { buildPromptWithSharedContext } from '../services/chatPromptPipeline'
import { buildChatHistory } from '../services/chatHistory'
import { getPayloadWarningData } from '../services/chatPayloadPreflight'
import {
  buildAgentSendSlimPlan,
  evaluateAgentSendPreflight,
  evaluateBuiltMessagesPreflight,
} from '../services/agentSendPreflight'
import { appendToSpecAcceptanceFile } from '../services/specAcceptanceService'
import { findRetryUserText } from '../services/chatRetry'
import { buildMcpFollowUpMessages } from '../services/chatMcpFollowUp'
import { removeTrailingUserMessage, upsertAssistantMessage } from '../services/chatMessageState'
import { applyPlanArtifactsWithResult, buildPlanModeSystemPrompt } from '../services/planModeService'
import { buildPlanExecutionPrompt, getFirstPlanStep } from '../services/planExecutionService'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { createBackgroundJob } from '../services/backgroundJobsApiService'
import { appendPlanExecutionBackfill } from '../services/planBackfillService'
import { markPlanStepDone } from '../services/planStepCompletionService'
import {
  loadQueuedPlanExecutionsDetailed,
  saveQueuedPlanExecutions,
} from '../services/planQueuePersistenceService'
import {
  loadQueuedSpecExecutionsDetailed,
  saveQueuedSpecExecutions,
} from '../services/specQueuePersistenceService'
import { TaskQueuePanel } from './TaskQueuePanel'
import {
  buildQueueExecutionReportMarkdown,
  buildQueueReportPath,
  upsertQueueReportFile,
  type QueueExecutionReportInput,
} from '../services/queueExecutionReportService'
import { findLatestReportPath } from '../services/reportCatalogService'
import {
  buildQueueRestoreFromReport,
  mergePlanRestoreItems,
  mergeSpecRestoreItems,
} from '../services/queueReportRestoreService'
import {
  loadQueueAutoReportPrefs,
  notifyQueueComplete,
} from '../services/queueAutoReportPrefsService'
import {
  loadQueueSessionStats,
  saveQueueSessionStats,
} from '../services/queueSessionStatsPersistenceService'
import {
  buildIdeSpecQueueCoordinatorDeps,
  onSpecQueueItemSucceeded,
} from '../services/runtime/runtimeQueueCoordinator'
import {
  clearRuntimeQueuePause,
  getRuntimeQueuePause,
  subscribeRuntimeQueuePause,
} from '../services/runtime/runtimeQueuePause'
import type { QueuedSpecBackfill } from '../store/ideStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

type SendAction = 'explain' | 'refactor' | 'fix' | 'generate'

type SendOptions = {
  forceSlim?: boolean
}

type FailedPlanExecution = {
  prompt: string
  backfill: { planPath: string; stepText: string; stepLine?: number }
  error: string
}

type FailedSpecExecution = {
  prompt: string
  backfill: { taskPath: string; taskText: string; specAcceptancePath: string }
  error: string
}

type QueueDoneItem = {
  kind: 'plan' | 'spec'
  text: string
}

const CHAT_MESSAGES_STORAGE_KEY = 'ai-ide:chat-messages'
const CHAT_INPUT_STORAGE_KEY = 'ai-ide:chat-input'
const MAX_PERSISTED_MESSAGES = 200

interface ChatPanelProps {
  aiConfig: AIConfig
  currentCode: string
  onGenerateFiles?: (files: { name: string; content: string; language: string }[]) => void
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  /** When true, hides duplicate session title (right rail already has a header). */
  embeddedInRightPanel?: boolean
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  aiConfig,
  currentCode,
  onGenerateFiles,
  notify,
  embeddedInRightPanel = false,
}) => {
  const { t, language } = useI18n()
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const runtimeQueuePause = useSyncExternalStore(
    subscribeRuntimeQueuePause,
    getRuntimeQueuePause,
    () => null,
  )

  const createWelcomeMessage = useCallback(
    (config: AIConfig) => {
      const modelSuffix = config.model ? t('ai.chat.welcomeModel', { model: config.model }) : ''
      const intro = t('ai.chat.welcome', { provider: config.provider, modelSuffix })
      return `${intro}

${t('ai.chat.helpIntro')}
- ${t('ai.chat.bullet.explain')}
- ${t('ai.chat.bullet.refactor')}
- ${t('ai.chat.bullet.generate')}
- ${t('ai.chat.bullet.fix')}

${t('ai.chat.prompt')}`
    },
    [t],
  )

  const quickActionLabels = useMemo(
    () =>
      ({
        explain: t('ai.chat.quick.explain'),
        refactor: t('ai.chat.quick.refactor'),
        fix: t('ai.chat.quick.fix'),
        generate: t('ai.chat.quick.generate'),
      }) as const,
    [t],
  )
  const currentUser = useIDEStore((s) => s.currentUser)
  const editorFiles = useIDEStore((s) => s.files)
  const activeFileIndex = useIDEStore((s) => s.activeFile)
  const queuedChatPrompt = useIDEStore((s) => s.queuedChatPrompt)
  const setQueuedChatPrompt = useIDEStore((s) => s.setQueuedChatPrompt)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const setQueuedSpecBackfill = useIDEStore((s) => s.setQueuedSpecBackfill)
  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const setQueuedSpecExecutions = useIDEStore((s) => s.setQueuedSpecExecutions)
  const shiftQueuedSpecExecution = useIDEStore((s) => s.shiftQueuedSpecExecution)
  const queuedPlanBackfill = useIDEStore((s) => s.queuedPlanBackfill)
  const setQueuedPlanBackfill = useIDEStore((s) => s.setQueuedPlanBackfill)
  const queuedPlanExecutions = useIDEStore((s) => s.queuedPlanExecutions)
  const shiftQueuedPlanExecution = useIDEStore((s) => s.shiftQueuedPlanExecution)
  const setQueuedPlanExecutions = useIDEStore((s) => s.setQueuedPlanExecutions)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)
  const setShowChatPanel = useIDEStore((s) => s.setShowChatPanel)
  const setShowGitPanel = useIDEStore((s) => s.setShowGitPanel)
  const backgroundAgentOn = isBackgroundAgentEnabled()
  const [backgroundSubmitting, setBackgroundSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [controlsExpanded, setControlsExpanded] = useState(() => {
    try {
      return localStorage.getItem('ai-ide:chat-controls-expanded') === 'true'
    } catch {
      return false
    }
  })
  const [useWorkspaceContext, setUseWorkspaceContext] = useState(false)
  const [agentMode, setAgentMode] = useState(true)
  const [planMode, setPlanMode] = useState(() => {
    try {
      return localStorage.getItem('ai-ide:chat-plan-mode') === 'true'
    } catch {
      return false
    }
  })
  const lastPlanPathRef = useRef<string | null>(null)
  const [workspaceStats, setWorkspaceStats] = useState(workspaceContextService.getStats())
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Message[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return [{ role: 'assistant', content: createWelcomeMessage(aiConfig) }]
  })
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem(CHAT_INPUT_STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [sendQueue, setSendQueue] = useState<PendingSend[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const sessionStatus: ChatSessionStatus = useMemo(() => {
    if (loading) return 'running'
    if (sendQueue.length > 0 || queuedChatPrompt || queuedPlanExecutions.length > 0 || queuedSpecExecutions.length > 0) return 'queued'
    return 'idle'
  }, [loading, queuedChatPrompt, queuedPlanExecutions.length, queuedSpecExecutions.length, sendQueue.length])
  const activeQueueTask = useMemo(() => {
    if (queuedPlanBackfill) return `Plan：${queuedPlanBackfill.stepText}`
    if (queuedSpecBackfill) return `Spec：${queuedSpecBackfill.taskText}`
    if (loading) return '正在处理中...'
    return null
  }, [loading, queuedPlanBackfill, queuedSpecBackfill])

  const [pendingAgentChanges, setPendingAgentChanges] = useState<AgentFileChange[] | null>(null)
  const [agentActivity, setAgentActivity] = useState<AgentActivityEntry[]>([])
  const [lastRunRounds, setLastRunRounds] = useState(0)
  const [mcpToolEntries, setMcpToolEntries] = useState<McpToolLogEntry[]>([])
  const [subscriptionExpiredBanner, setSubscriptionExpiredBanner] = useState<string | null>(null)
  const [mentionHits, setMentionHits] = useState<IndexSearchHit[]>([])
  const [recentMentionHits, setRecentMentionHits] = useState<IndexSearchHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [payloadWarning, setPayloadWarning] = useState<{
    estimatedBytes: number
    budgetBytes: number
    text: string
    action?: SendAction
    slimPlan: string[]
  } | null>(null)
  const [failedPlanExecution, setFailedPlanExecution] = useState<FailedPlanExecution | null>(null)
  const [failedSpecExecution, setFailedSpecExecution] = useState<FailedSpecExecution | null>(null)
  const [queueFailureStats, setQueueFailureStats] = useState({ plan: 0, spec: 0 })
  const [queueSuccessStats, setQueueSuccessStats] = useState({ plan: 0, spec: 0 })
  const [recentDoneQueueItems, setRecentDoneQueueItems] = useState<QueueDoneItem[]>([])
  const [queueSessionStatsHydrated, setQueueSessionStatsHydrated] = useState(false)
  const [activeMentionQuery, setActiveMentionQuery] = useState<string | null>(null)
  const [mentionOnboardingDismissed, setMentionOnboardingDismissed] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('ai-ide:mention-onboarding-dismissed') === 'true'
    } catch {
      return false
    }
  })
  const [indexVersion, setIndexVersion] = useState(() => projectIndexManager.getVersion())
  const indexStats = useMemo(() => projectIndexManager.getIndexStats(), [indexVersion])
  const indexBuildState = useMemo(() => projectIndexManager.getBuildState(), [indexVersion])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const stopRequestedRef = useRef(false)
  const stopGeneration = useCallback(() => {
    trackEvent('chat.abort', {
      provider: aiConfig.provider,
      agentMode,
      workspaceContext: useWorkspaceContext,
      messageCount: messages.length,
    })
    stopRequestedRef.current = true
    streamAbortRef.current?.abort()
  }, [agentMode, aiConfig.provider, messages.length, useWorkspaceContext])

  const [quota, setQuota] = useState<QuotaCheck>({
    allowed: true,
    used: 0,
    limit: 50,
    remaining: 50,
    plan: currentPlan,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loaded = loadQueueSessionStats()
    if (loaded.stats) {
      setQueueSuccessStats(loaded.stats.success)
      setQueueFailureStats(loaded.stats.failure)
      setRecentDoneQueueItems(loaded.stats.recentDone)
    }
    if (loaded.corrupted) {
      notify?.('info', t('queue.sessionStats.corrupted'), '')
    }
    setQueueSessionStatsHydrated(true)
  }, [notify, t])

  useEffect(() => {
    if (!queueSessionStatsHydrated) return
    saveQueueSessionStats({
      success: queueSuccessStats,
      failure: queueFailureStats,
      recentDone: recentDoneQueueItems,
    })
  }, [queueSessionStatsHydrated, queueSuccessStats, queueFailureStats, recentDoneQueueItems])

  const isConfigured = isAiConfigured(aiConfig, Boolean(currentUser))
  const needsPlatformSignIn =
    !isConfigured && isAiGatewayEnabled() && aiConfig.keyMode === 'platform' && !currentUser
  const chatConfigHint = needsPlatformSignIn ? t('chat.needSignInForPlatform') : t('chat.needConfig')

  const projectRules = useMemo(() => {
    const sources = collectRulesSources(
      editorFiles,
      workspaceContextService.getAllFiles().map((file) => ({
        path: file.path,
        content: file.content,
      })),
    )
    return extractProjectRules(sources)
  }, [editorFiles, workspaceStats.selectedFiles])

  const projectTasks = useMemo(() => {
    const sources = collectTasksSources(
      editorFiles,
      workspaceContextService.getAllFiles().map((file) => ({
        path: file.path,
        content: file.content,
      })),
    )
    return extractProjectTasks(sources)
  }, [editorFiles, workspaceStats.selectedFiles])

  const specSources = useMemo(
    () =>
      collectSpecSources(
        editorFiles,
        workspaceContextService.getAllFiles().map((file) => ({
          path: file.path,
          content: file.content,
        })),
      ),
    [editorFiles, workspaceStats.selectedFiles],
  )

  useEffect(() => projectIndexManager.subscribe(() => setIndexVersion(projectIndexManager.getVersion())), [])

  const mentionBlockedByIndexBuild = indexBuildState.status === 'building'

  const refreshMentionHits = useCallback(
    (text: string, cursor: number) => {
      const query = getActiveMentionQuery(text, cursor)
      if (query === null) {
        setActiveMentionQuery(null)
        setMentionHits([])
        return
      }
      setActiveMentionQuery(query)
      if (mentionBlockedByIndexBuild) {
        setMentionHits(recentMentionHits)
        setMentionIndex(0)
        return
      }
      const hits = projectIndexManager.search(query, 8)
      setMentionHits(hits)
      if (hits.length > 0) setRecentMentionHits(hits)
      setMentionIndex(0)
    },
    [indexVersion, mentionBlockedByIndexBuild, recentMentionHits],
  )

  const activeFilePath = editorFiles[activeFileIndex]?.name ?? null

  const applyProjectRules = useCallback(
    (prompt: string) =>
      appendSpecsContext(
        appendOpenTasksToPrompt(appendProjectRules(prompt, projectRules, language), projectTasks, language),
        specSources,
        language,
      ),
    [projectRules, projectTasks, specSources, language],
  )

  const applyAgentContext = useCallback(
    (prompt: string, agentSettings: Awaited<ReturnType<typeof loadAgentSettings>>) =>
      appendAgentContextSections(prompt, {
        language,
        activeFilePath,
        agentSettings,
      }),
    [activeFilePath, language],
  )

  const chatHistoryMessages = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  )

  const [mcpToolsEnabled, setMcpToolsEnabled] = useState(
    () => getMcpServersSync().filter((s) => s.enabled && s.url.trim()).length > 0,
  )
  const [mcpToolCount, setMcpToolCount] = useState<number | undefined>(() =>
    getMcpToolCountEstimateSync(),
  )

  useEffect(() => {
    let cancelled = false
    void loadMcpServers().then(() =>
      getEnabledMcpServers().then((servers) => {
        if (!cancelled) setMcpToolsEnabled(servers.length > 0)
      }),
    )
    void refreshMcpToolCountEstimate().then((count) => {
      if (!cancelled) setMcpToolCount(count > 0 ? count : undefined)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const payloadEstimate = useMemo(() => {
    if (!isConfigured) return null
    const hasDraft = Boolean(input.trim())
    const hasSession = messages.length > 2
    if (!hasDraft && !useWorkspaceContext && !hasSession) return null

    const semanticSearchEnabled =
      useWorkspaceContext && isSemanticSearchEnabled() && canUseEmbeddings(aiConfig)
    const agentToolLoopEnabled =
      agentMode &&
      !planMode &&
      DEFAULT_AGENT_SETTINGS.useToolLoop &&
      supportsAgentToolCalling(aiConfig.provider)
    const mcpReserveOn = agentMode && mcpToolsEnabled

    return estimateChatPayload({
      draftText: input,
      messages: chatHistoryMessages,
      provider: aiConfig.provider,
      language,
      agentMode,
      useWorkspaceContext,
      workspaceSelectedFiles: workspaceStats.selectedFiles,
      currentCode,
      editorFiles,
      index: projectIndexManager.getIndex(),
      activeFilePath,
      applyProjectRules,
      defaultSystemPrompt: t('chat.system.default', { code: currentCode }),
      semanticSearchEnabled,
      agentToolLoopEnabled,
      mcpToolsEnabled: mcpReserveOn,
      mcpToolCount: mcpReserveOn ? mcpToolCount : undefined,
    })
  }, [
    agentMode,
    mcpToolsEnabled,
    mcpToolCount,
    aiConfig.apiKey,
    aiConfig.provider,
    applyProjectRules,
    chatHistoryMessages,
    currentCode,
    editorFiles,
    indexVersion,
    input,
    isConfigured,
    language,
    messages.length,
    t,
    useWorkspaceContext,
    workspaceStats.selectedFiles,
    activeFilePath,
    planMode,
  ])

  const payloadMeterEstimate = useMemo(
    () => (payloadEstimate ? applyPayloadMeterReserve(payloadEstimate) : null),
    [payloadEstimate],
  )

  const mentionPreflight = useMemo(() => {
    if (!input.includes('@')) return null
    return runMentionPreflight(input, editorFiles, projectIndexManager.getIndex())
  }, [editorFiles, indexVersion, input])

  const largeRepoHint = useMemo(() => getLargeRepoContextHint(indexStats), [indexStats])

  const showLargeRepoHint = useMemo(
    () =>
      shouldShowLargeRepoHint(largeRepoHint, {
        useWorkspaceContext,
        mentionTokenCount: mentionPreflight?.tokens.length ?? 0,
      }),
    [largeRepoHint, mentionPreflight?.tokens.length, useWorkspaceContext],
  )

  const augmentWithSemanticContext = useCallback(
    async (basePrompt: string, query: string) => {
      if (!useWorkspaceContext || !isSemanticSearchEnabled() || !canUseEmbeddings(aiConfig)) {
        return basePrompt
      }

      const workspaceFiles = workspaceContextService.getAllFiles().map((file) => ({
        path: file.path,
        content: file.content,
      }))
      const searchable = collectSearchableFiles(
        editorFiles.map((file) => ({ name: file.name, content: file.content })),
        workspaceFiles,
      ).map((file) => ({ path: file.name, content: file.content }))
      const candidatePaths = projectIndexManager
        .search(query, 16)
        .map((item) => item.path)
        .filter((path, index, arr) => arr.indexOf(path) === index)

      const section = await buildSemanticContextSection(query, searchable, aiConfig, language, {
        candidatePaths,
      })
      return section ? `${basePrompt}${section}` : basePrompt
    },
    [aiConfig, editorFiles, language, useWorkspaceContext],
  )

  const buildAgentWorkspaceSummary = useCallback(
    async (userGoal: string, actionLabel?: string, forceSlim = false) => {
      const agentSettings = await loadAgentSettings()
      const effectiveWorkspaceContext = forceSlim ? false : useWorkspaceContext
      const base =
        effectiveWorkspaceContext && workspaceStats.selectedFiles > 0
          ? workspaceContextService.generateSystemPrompt(actionLabel ?? '', language)
          : t('chat.prompt.editorFile', { code: currentCode })
      const mcpSection = await buildMcpToolsPromptSection()
      const summary = await buildPromptWithSharedContext({
        basePrompt: base,
        query: userGoal,
        forceSlim,
        applyProjectRules,
        augmentWithSemanticContext,
        applyAgentContext: (prompt) => applyAgentContext(prompt, agentSettings),
        buildMentionSection: (query) =>
          buildMentionContextSection(query, editorFiles, projectIndexManager.getIndex(), language),
      })
      return appendMcpToolsToPrompt(summary, mcpSection)
    },
    [
      applyAgentContext,
      applyProjectRules,
      augmentWithSemanticContext,
      currentCode,
      editorFiles,
      language,
      t,
      useWorkspaceContext,
      workspaceStats.selectedFiles,
    ],
  )

  const handleBackgroundRun = useCallback(async () => {
    const text = input.trim()
    if (!text || backgroundSubmitting || loading) return
    if (!currentUser) {
      notify?.('error', t('backgroundJobs.loginRequired'))
      return
    }
    if (!isConfigured) {
      notify?.('error', chatConfigHint)
      return
    }

    setBackgroundSubmitting(true)
    try {
      const workspaceSummary = await buildAgentWorkspaceSummary(text)
      const prompt = `${workspaceSummary}\n\n---\n\n## ${t('chat.backgroundRun.taskHeading')}\n${text}`
      const { job, error } = await createBackgroundJob({ prompt, repoKey: 'default' }, t)
      if (error || !job) {
        const upgradeHint =
          error?.includes('升级') || error?.includes('Upgrade') || error?.includes('Pro')
            ? t('chat.backgroundRun.upgradeHint')
            : undefined
        notify?.('error', t('chat.backgroundRun.failed'), upgradeHint ?? error)
        return
      }
      setInput('')
      setShowGitPanel(false)
      setShowChatPanel(true)
      setRightPanelView('backgroundJobs')
      notify?.('success', t('chat.backgroundRun.queued'), t('chat.backgroundRun.queuedDetail'))
    } finally {
      setBackgroundSubmitting(false)
    }
  }, [
    backgroundSubmitting,
    buildAgentWorkspaceSummary,
    chatConfigHint,
    currentUser,
    input,
    isConfigured,
    loading,
    notify,
    setRightPanelView,
    setShowChatPanel,
    setShowGitPanel,
    t,
  ])

  const refreshQuota = useCallback(() => {
    void fetchAIQuota(currentPlan, !!currentUser).then(setQuota)
  }, [currentPlan, currentUser])

  useEffect(() => {
    refreshQuota()
  }, [currentPlan, currentUser, refreshQuota])

  useEffect(() => {
    const onBillingSync = (event: Event) => {
      refreshQuota()
      const detail = (event as CustomEvent<{ notice?: string; previousPlan?: string; message?: string }>)
        .detail
      if (
        detail?.notice === 'expired' &&
        detail.previousPlan &&
        detail.previousPlan !== 'free'
      ) {
        setSubscriptionExpiredBanner(detail.message || t('chat.subscriptionExpired'))
      }
    }
    window.addEventListener(BILLING_SYNC_EVENT, onBillingSync)
    return () => window.removeEventListener(BILLING_SYNC_EVENT, onBillingSync)
  }, [refreshQuota, t])

  const refreshWorkspaceStats = useCallback(() => {
    setWorkspaceStats(workspaceContextService.getStats())
  }, [])

  useEffect(() => {
    refreshWorkspaceStats()
    const unsubscribe = workspaceContextService.onChange(refreshWorkspaceStats)
    return () => unsubscribe()
  }, [refreshWorkspaceStats])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    try {
      const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES)
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // ignore persistence errors
    }
  }, [messages])

  useEffect(() => {
    try {
      if (input.trim()) {
        localStorage.setItem(CHAT_INPUT_STORAGE_KEY, input)
      } else {
        localStorage.removeItem(CHAT_INPUT_STORAGE_KEY)
      }
    } catch {
      // ignore persistence errors
    }
  }, [input])

  useEffect(() => {
    if (!isConfigured) {
      setMessages([
        {
          role: 'assistant',
          content: t('chat.needKey'),
        },
      ])
      return
    }

    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: createWelcomeMessage(aiConfig) }]
      }
      return prev
    })
  }, [aiConfig, isConfigured, createWelcomeMessage, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const appendError = (content: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content, isError: true }])
  }

  const copyMessageText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        notify?.('success', t('chat.action.copied'), t('chat.action.copyDetail'))
      } catch {
        notify?.('error', t('chat.action.copyFailed'))
      }
    },
    [notify, t],
  )

  const saveCurrentRun = useCallback(async () => {
    if (agentActivity.length === 0) return
    const summary = messages[messages.length - 1]?.content?.slice(0, 120) || 'Agent run'
    await saveAgentRunHistoryItem({
      summary,
      rounds: lastRunRounds,
      activity: agentActivity,
      pendingChanges: pendingAgentChanges ?? [],
    })
    notify?.('success', '已保存', '本次 Agent 运行记录已保存')
  }, [agentActivity, lastRunRounds, messages, notify, pendingAgentChanges])

  const replayLastRun = useCallback(async () => {
    const history = await loadAgentRunHistory()
    const latest = history[0]
    if (!latest) {
      notify?.('error', '无记录', '还没有已保存的 Agent 运行')
      return
    }
    setAgentActivity(latest.activity)
    setPendingAgentChanges(latest.pendingChanges)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `已回放最近一次运行（${latest.activity.length} 条工具活动，${latest.rounds} 轮）`,
      },
    ])
  }, [notify])

  const exportRunMarkdown = useCallback(() => {
    if (agentActivity.length === 0) return
    const lines = [
      '# Agent Run',
      '',
      `- Rounds: ${lastRunRounds}`,
      `- Activities: ${agentActivity.length}`,
      '',
      '## Activity',
      ...agentActivity.map((entry, idx) => `- ${idx + 1}. [${entry.ok ? 'OK' : 'FAIL'}] ${entry.tool} - ${entry.detail}`),
    ]
    void copyMessageText(lines.join('\n'))
  }, [agentActivity, copyMessageText, lastRunRounds])

  const buildQueueReportInput = useCallback((): QueueExecutionReportInput => {
    const planHints = [
      ...(failedPlanExecution
        ? [
            {
              planPath: failedPlanExecution.backfill.planPath,
              stepText: failedPlanExecution.backfill.stepText,
              stepLine: failedPlanExecution.backfill.stepLine,
            },
          ]
        : []),
      ...(queuedPlanBackfill
        ? [
            {
              planPath: queuedPlanBackfill.planPath,
              stepText: queuedPlanBackfill.stepText,
              stepLine: queuedPlanBackfill.stepLine,
            },
          ]
        : []),
      ...queuedPlanExecutions.map((item) => item.backfill),
    ]
    const specHints = [
      ...(failedSpecExecution
        ? [{ taskPath: failedSpecExecution.backfill.taskPath, taskText: failedSpecExecution.backfill.taskText }]
        : []),
      ...(queuedSpecBackfill
        ? [{ taskPath: queuedSpecBackfill.taskPath, taskText: queuedSpecBackfill.taskText }]
        : []),
      ...queuedSpecExecutions.map((item) => ({
        taskPath: item.backfill.taskPath,
        taskText: item.backfill.taskText,
      })),
    ]
    return {
      sessionStatus,
      runId,
      activeTask: activeQueueTask,
      success: queueSuccessStats,
      failure: queueFailureStats,
      recentDone: recentDoneQueueItems,
      pending: {
        planQueue: queuedPlanExecutions.length,
        specQueue: queuedSpecExecutions.length,
        sendQueue: sendQueue.length,
        planPreview: queuedPlanExecutions.slice(0, 8).map((item) => item.backfill.stepText),
        specPreview: queuedSpecExecutions.slice(0, 8).map((item) => item.backfill.taskText),
      },
      failedPlan: failedPlanExecution
        ? { stepText: failedPlanExecution.backfill.stepText, error: failedPlanExecution.error }
        : null,
      failedSpec: failedSpecExecution
        ? { taskText: failedSpecExecution.backfill.taskText, error: failedSpecExecution.error }
        : null,
      restoreHints: { plan: planHints, spec: specHints },
    }
  }, [
    activeQueueTask,
    failedPlanExecution,
    failedSpecExecution,
    queueFailureStats,
    queueSuccessStats,
    queuedPlanBackfill,
    queuedPlanExecutions,
    queuedSpecBackfill,
    queuedSpecExecutions,
    recentDoneQueueItems,
    runId,
    sendQueue.length,
    sessionStatus,
  ])

  const exportQueueReport = useCallback(() => {
    const markdown = buildQueueExecutionReportMarkdown(buildQueueReportInput())
    void copyMessageText(markdown)
    notify?.('success', '已复制', '队列执行报告已复制到剪贴板')
  }, [buildQueueReportInput, copyMessageText, notify])

  const saveQueueReportToWorkspace = useCallback(() => {
    const markdown = buildQueueExecutionReportMarkdown(buildQueueReportInput())
    const path = buildQueueReportPath()
    setFiles((prev) => {
      const result = upsertQueueReportFile(prev, markdown, path)
      setActiveFile(result.index)
      return result.files
    })
    notify?.('success', '已保存', `报告已写入 ${path}`)
  }, [buildQueueReportInput, notify, setActiveFile, setFiles])

  const openLatestQueueReport = useCallback(() => {
    const path = findLatestReportPath(editorFiles.map((f) => ({ name: f.name, content: f.content })))
    if (!path) {
      notify?.('info', '暂无报告', '请先在任务队列中保存报告到 .aide/reports')
      return
    }
    const index = editorFiles.findIndex((f) => f.name === path)
    if (index < 0) {
      notify?.('error', '无法打开', `未找到报告文件：${path}`)
      return
    }
    setActiveFile(index)
  }, [editorFiles, notify, setActiveFile])

  const applyRestoreFromMarkdown = useCallback(
    (markdown: string) => {
      const fileLikes = editorFiles.map((f) => ({ name: f.name, content: f.content }))
      const result = buildQueueRestoreFromReport(markdown, fileLikes)
      if (result.planItems.length === 0 && result.specItems.length === 0) {
        notify?.('info', '无可恢复项', result.unresolved.length ? result.unresolved.join('；') : '报告中没有可匹配的待执行项')
        return
      }
      setFailedPlanExecution(null)
      setFailedSpecExecution(null)
      const mergedPlan = mergePlanRestoreItems(queuedPlanExecutions, result.planItems, queuedPlanBackfill)
      const mergedSpec = mergeSpecRestoreItems(queuedSpecExecutions, result.specItems, queuedSpecBackfill)
      if (mergedSpec.length > 0) {
        const [first, ...rest] = mergedSpec
        setQueuedSpecExecutions(rest)
        setQueuedPlanExecutions(mergedPlan)
        setQueuedSpecBackfill(first.backfill)
        setQueuedChatPrompt(first.prompt)
      } else if (mergedPlan.length > 0) {
        const [first, ...rest] = mergedPlan
        setQueuedPlanExecutions(rest)
        setQueuedSpecExecutions([])
        setQueuedPlanBackfill(first.backfill)
        setQueuedChatPrompt(first.prompt)
      } else {
        setQueuedPlanExecutions(mergedPlan)
        setQueuedSpecExecutions(mergedSpec)
      }
      const detail = [
        `Plan ${result.planItems.length} · Spec ${result.specItems.length}`,
        result.unresolved.length ? `未匹配 ${result.unresolved.length} 项` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      notify?.('success', '已恢复队列', detail)
    },
    [
      editorFiles,
      notify,
      queuedPlanBackfill,
      queuedPlanExecutions,
      queuedSpecBackfill,
      queuedSpecExecutions,
      setQueuedChatPrompt,
      setQueuedPlanBackfill,
      setQueuedPlanExecutions,
      setQueuedSpecBackfill,
      setQueuedSpecExecutions,
    ],
  )

  const restoreQueueFromLatestReport = useCallback(() => {
    const path = findLatestReportPath(editorFiles.map((f) => ({ name: f.name, content: f.content })))
    if (!path) {
      notify?.('info', '暂无报告', '请先保存一份队列报告')
      return
    }
    const file = editorFiles.find((f) => f.name === path)
    if (!file) return
    applyRestoreFromMarkdown(file.content)
  }, [applyRestoreFromMarkdown, editorFiles, notify])

  const lastQueueSnapshotRef = useRef<QueueExecutionReportInput | null>(null)
  const wasQueueBusyRef = useRef(false)

  const isQueueBusy = useMemo(() => {
    return !!(
      loading ||
      queuedChatPrompt ||
      queuedSpecBackfill ||
      queuedSpecExecutions.length > 0 ||
      queuedPlanBackfill ||
      queuedPlanExecutions.length > 0 ||
      sendQueue.length > 0 ||
      failedPlanExecution ||
      failedSpecExecution
    )
  }, [
    failedPlanExecution,
    failedSpecExecution,
    loading,
    queuedChatPrompt,
    queuedPlanBackfill,
    queuedPlanExecutions.length,
    queuedSpecBackfill,
    queuedSpecExecutions.length,
    sendQueue.length,
  ])

  useEffect(() => {
    if (isQueueBusy) {
      lastQueueSnapshotRef.current = buildQueueReportInput()
    }
  }, [buildQueueReportInput, isQueueBusy])

  useEffect(() => {
    if (wasQueueBusyRef.current && !isQueueBusy) {
      const prefs = loadQueueAutoReportPrefs()
      const snapshot = lastQueueSnapshotRef.current
      if (prefs.autoSaveOnComplete && snapshot) {
        const markdown = buildQueueExecutionReportMarkdown(snapshot)
        const path = buildQueueReportPath()
        setFiles((prev) => {
          const result = upsertQueueReportFile(prev, markdown, path)
          setActiveFile(result.index)
          return result.files
        })
        notify?.('success', '已自动保存', `队列报告：${path}`)
      }
      if (prefs.notifyOnComplete) {
        notifyQueueComplete('AI IDE', '任务队列已执行完毕')
      }
    }
    wasQueueBusyRef.current = isQueueBusy
  }, [isQueueBusy, notify, setActiveFile, setFiles])

  const appendExecutionToSpecAcceptance = useCallback(
    (specAcceptancePath: string, taskText: string, assistantOutput: string, executionRunId?: string | null) => {
      const file = editorFiles.find((f) => f.name === specAcceptancePath)
      if (!file) return

      const addition = buildSpecExecutionLog(taskText, assistantOutput, new Date(), {
        runId: executionRunId ?? null,
        provider: aiConfig.provider,
        model: aiConfig.model || undefined,
      })
      if (!addition) return

      setFiles((prev) => appendToSpecAcceptanceFile(prev, specAcceptancePath, addition))
    },
    [aiConfig.model, aiConfig.provider, editorFiles, setFiles],
  )

  const specQueueCoordinatorDeps = useCallback(
    () =>
      buildIdeSpecQueueCoordinatorDeps({
        setFiles,
        setQueuedChatPrompt,
        setQueuedSpecBackfill,
        setQueuedSpecExecutions,
      }),
    [setFiles, setQueuedChatPrompt, setQueuedSpecBackfill, setQueuedSpecExecutions],
  )

  const finishSpecQueueItem = useCallback(
    async (backfill: QueuedSpecBackfill) => {
      const result = await onSpecQueueItemSucceeded(backfill, specQueueCoordinatorDeps())
      if (!result.verifyOk) {
        notify?.(
          'error',
          t('runtime.verifyFail.title'),
          result.verifyDetail ?? t('runtime.verifyFail.detail'),
        )
      }
    },
    [notify, specQueueCoordinatorDeps, t],
  )

  const generateFilesFromResponse = useCallback(
    (assistantContent: string) => {
      if (!onGenerateFiles) return

      const codeBlocks = extractCodeBlocks(assistantContent)
      const files: { name: string; content: string; language: string }[] = []

      codeBlocks.forEach((block, index) => {
        if (!block.language || block.language === 'text') return

        const blockStart = assistantContent.indexOf(`\`\`\`${block.language}`)
        const contextBefore = assistantContent.slice(0, blockStart).split('\n').slice(-5)
        let filename: string | null = null

        const patterns = [
          /###\s+([\w\-./]+\.[\w]+)/,
          /`([\w\-./]+\.[\w]+)`/,
          /文件名[:\s]+([\w\-./]+\.[\w]+)/i,
          /文件[:\s]+([\w\-./]+\.[\w]+)/i,
          /filename[:\s]+([\w\-./]+\.[\w]+)/i,
          /file[:\s]+([\w\-./]+\.[\w]+)/i,
          /([\w\-./]+\.(?:js|ts|jsx|tsx|py|html|css|scss|json|md|vue|java|go|rs|php|rb|swift|kt|sql))/i,
        ]

        for (const line of [...contextBefore].reverse()) {
          for (const pattern of patterns) {
            const match = line.match(pattern)
            if (match) {
              filename = match[1]
              break
            }
          }
          if (filename) break
        }

        if (!filename) {
          filename = `generated-${index + 1}.${block.language === 'typescript' ? 'ts' : block.language === 'javascript' ? 'js' : block.language}`
        }

        files.push({
          name: filename,
          content: block.code,
          language: block.language,
        })
      })

      if (files.length > 0) onGenerateFiles(files)
    },
    [onGenerateFiles],
  )

  const handleSend = async (customInput?: string, action?: SendAction, options?: SendOptions) => {
    const textToSend = customInput || input
    if (!textToSend.trim()) return
    if (loading) {
      setSendQueue((prev) =>
        enqueueSend(
          { status: 'running', runId, queue: prev },
          { text: textToSend, action, options },
        ).queue,
      )
      notify?.('info', '已加入队列', `待执行任务 +1（当前 ${sendQueue.length + 1}）`)
      if (!customInput) setInput('')
      return
    }

    const currentQuota = await fetchAIQuota(currentPlan, !!currentUser)
    setQuota(currentQuota)

    if (!currentQuota.allowed) {
      notify?.('error', t('notify.quotaExceeded'), t('notify.quotaExceededDetail', {
        used: currentQuota.used,
        limit: currentQuota.limit,
      }))
      appendError(
        t('chat.quotaExceeded', { used: currentQuota.used, limit: currentQuota.limit }),
      )
      return
    }

    if (!isConfigured) {
      appendError(chatConfigHint)
      return
    }
    const forceSlim = !!options?.forceSlim
    const effectiveTextToSend = forceSlim ? textToSend.slice(0, 1200) : textToSend
    const effectiveWorkspaceContext = forceSlim ? false : useWorkspaceContext
    const historyLimit = forceSlim ? 6 : 20

    const userMessage: Message = { role: 'user', content: effectiveTextToSend }
    setMessages((prev) => [...prev, userMessage])
    if (!customInput) setInput('')
    setPayloadWarning(null)
    setLoading(true)
    const started = startRun(createInitialChatSessionState())
    const executionRunId = started.runId
    setRunId(executionRunId)
    stopRequestedRef.current = false
    streamAbortRef.current?.abort()
    streamAbortRef.current = new AbortController()
    setAgentActivity([])
    setMcpToolEntries([])

    try {
      const mentionCheck = runMentionPreflight(
        effectiveTextToSend,
        editorFiles,
        projectIndexManager.getIndex(),
      )
      const mentionGate = evaluateSendMentionGate(mentionCheck, forceSlim)
      if (mentionGate.unresolvedCount > 0 && !forceSlim) {
        trackEvent('chat.mention_preflight_unresolved', {
          count: mentionGate.unresolvedCount,
          tokens: mentionCheck.tokens.length,
        })
      }
      if (mentionGate.ambiguousCount > 0 && !forceSlim) {
        trackEvent('chat.mention_preflight_ambiguous', {
          count: mentionGate.ambiguousCount,
          tokens: mentionCheck.tokens.length,
        })
      }
      if (mentionGate.blocked) {
        setMessages((prev) => removeTrailingUserMessage(prev, effectiveTextToSend))
        setLoading(false)
        const ambiguousBlocked = mentionGate.blockReason === 'ambiguous'
        notify?.(
          'info',
          ambiguousBlocked
            ? t('chat.mention.blockSendAmbiguousTitle')
            : t('chat.mention.blockSendTitle'),
          ambiguousBlocked
            ? t('chat.mention.blockSendAmbiguousDetail', { count: mentionGate.ambiguousCount })
            : t('chat.mention.blockSendDetail', { count: mentionGate.unresolvedCount }),
        )
        return
      }

      const slimPlan = buildAgentSendSlimPlan(
        (key, params) => t(key, params),
        historyLimit,
        { agentMode },
      )
      const sendPreflight = evaluateAgentSendPreflight({
        mentionGate,
        meterEstimate: payloadMeterEstimate,
        draftText: textToSend,
        slimPlan,
        forceSlim,
      })
      if (sendPreflight.payloadWarning) {
        const warning = sendPreflight.payloadWarning
        trackEvent('chat.payload_preflight_warn', {
          estimatedBytes: warning.estimatedBytes,
          budgetBytes: warning.budgetBytes,
          provider: aiConfig.provider,
          agentMode,
          workspaceContext: effectiveWorkspaceContext,
          phase: 'meter',
        })
        setPayloadWarning({
          estimatedBytes: warning.estimatedBytes,
          budgetBytes: warning.budgetBytes,
          text: warning.text,
          action,
          slimPlan: warning.slimPlan,
        })
        if (!customInput) setInput(textToSend)
        setMessages((prev) => removeTrailingUserMessage(prev, effectiveTextToSend))
        setLoading(false)
        notify?.(
          'info',
          t('chat.payload.preflightWarnTitle'),
          t('chat.payload.preflightWarnDetail', {
            estimatedKb: toKb(warning.estimatedBytes),
            budgetKb: toKb(warning.budgetBytes),
          }),
        )
        return
      }

      const agentSettings = await loadAgentSettings()
      const history = buildChatHistory(
        messages.map((message) => ({ role: message.role, content: message.content })),
        historyLimit,
      )

      let aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
      let assistantContent = ''

      const useToolLoop =
        agentMode && !planMode && agentSettings.useToolLoop && supportsAgentToolCalling(aiConfig.provider)

      if (agentMode && useToolLoop) {
        const workspaceSummary = await buildAgentWorkspaceSummary(
          effectiveTextToSend,
          action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : undefined,
          forceSlim,
        )
        const toolMessages = buildAgentToolMessages(workspaceSummary, effectiveTextToSend, history)
        const builtPayloadWarning = evaluateBuiltMessagesPreflight({
          messages: toolMessages,
          provider: aiConfig.provider,
          draftText: textToSend,
          slimPlan,
          forceSlim,
        })
        if (builtPayloadWarning) {
          trackEvent('chat.payload_preflight_warn', {
            estimatedBytes: builtPayloadWarning.estimatedBytes,
            budgetBytes: builtPayloadWarning.budgetBytes,
            provider: aiConfig.provider,
            agentMode,
            workspaceContext: effectiveWorkspaceContext,
            phase: 'tool_loop',
          })
          setPayloadWarning({
            estimatedBytes: builtPayloadWarning.estimatedBytes,
            budgetBytes: builtPayloadWarning.budgetBytes,
            text: builtPayloadWarning.text,
            action,
            slimPlan: builtPayloadWarning.slimPlan,
          })
          if (!customInput) setInput(textToSend)
          setMessages((prev) => removeTrailingUserMessage(prev, effectiveTextToSend))
          setLoading(false)
          notify?.(
            'info',
            t('chat.payload.preflightWarnTitle'),
            t('chat.payload.preflightWarnDetail', {
              estimatedKb: toKb(builtPayloadWarning.estimatedBytes),
              budgetKb: toKb(builtPayloadWarning.budgetBytes),
            }),
          )
          return
        }

        const labelActivity = (tool: AgentActivityEntry['tool'], detail: string, ok: boolean) => {
          const toolLabel = t(`agent.tool.${tool}` as 'agent.tool.read_file')
          return t(ok ? 'agent.tool.lineOk' : 'agent.tool.lineFail', { tool: toolLabel, detail })
        }

        const result = await runAgentLoop(aiConfig, toolMessages, {
          onActivity: (entry) => {
            setAgentActivity((prev) => [...prev, entry])
          },
          onAssistantText: (text) => {
            assistantContent = text
            setMessages((prev) => upsertAssistantMessage(prev, text))
          },
          shouldStop: () => stopRequestedRef.current,
          signal: streamAbortRef.current?.signal,
        })

        assistantContent = result.finalContent
        setLastRunRounds(result.rounds)
        if (result.activity.length > 0) {
          const log = formatActivityForChat(result.activity, labelActivity)
          assistantContent = assistantContent
            ? `${assistantContent}\n\n---\n${log}`
            : log
        }

        setMessages((prev) => upsertAssistantMessage(prev, assistantContent))

        if (result.pendingChanges.length > 0) {
          setPendingAgentChanges(result.pendingChanges)
        } else {
          const agentChanges = parseAgentFileChanges(assistantContent)
          if (agentChanges.length > 0) {
            setPendingAgentChanges(agentChanges)
          } else {
            setPendingAgentChanges(null)
            generateFilesFromResponse(assistantContent)
          }
        }

        if (agentSettings.autoApplyWrites && onGenerateFiles) {
          const writtenPaths = result.activity
            .filter((a) => a.tool === 'write_file' && a.ok && a.detail)
            .map((a) => a.detail)
          if (writtenPaths.length > 0) {
            const payload = writtenPaths
              .map((path) => workspaceContextService.getFile(path))
              .filter((f): f is NonNullable<typeof f> => !!f)
              .map((f) => ({
                name: f.path,
                content: f.content,
                language: f.language,
              }))
            if (payload.length > 0) onGenerateFiles(payload)
          }
        }

        if (queuedSpecBackfill) {
          const specBackfill = queuedSpecBackfill
          appendExecutionToSpecAcceptance(
            specBackfill.specAcceptancePath,
            specBackfill.taskText,
            assistantContent,
            executionRunId,
          )
          setQueueSuccessStats((prev) => ({ ...prev, spec: prev.spec + 1 }))
          setRecentDoneQueueItems((prev) => [
            { kind: 'spec' as const, text: specBackfill.taskText },
            ...prev,
          ].slice(0, 5))
          setFailedSpecExecution(null)
          void finishSpecQueueItem(specBackfill)
        }

        if (queuedPlanBackfill) {
          setFiles((prev) =>
            markPlanStepDone(
              appendPlanExecutionBackfill(prev, {
                planPath: queuedPlanBackfill.planPath,
                stepText: queuedPlanBackfill.stepText,
                status: 'success',
                validation: 'completed',
                runId: executionRunId,
                provider: aiConfig.provider,
                model: aiConfig.model || undefined,
                assistantOutput: assistantContent,
              }),
              queuedPlanBackfill.planPath,
              { text: queuedPlanBackfill.stepText, line: queuedPlanBackfill.stepLine },
            ),
          )
          setQueuedPlanBackfill(null)
          setQueueSuccessStats((prev) => ({ ...prev, plan: prev.plan + 1 }))
          setRecentDoneQueueItems((prev) => [
            { kind: 'plan' as const, text: queuedPlanBackfill.stepText },
            ...prev,
          ].slice(0, 5))
          setFailedPlanExecution(null)
        }
        refreshQuota()
        return
      }

      if (agentMode) {
        const workspaceSummary = await buildAgentWorkspaceSummary(
          effectiveTextToSend,
          action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : undefined,
          forceSlim,
        )
        const finalSummary = planMode ? buildPlanModeSystemPrompt(workspaceSummary) : workspaceSummary
        aiMessages = aiAgentService.buildMessages(effectiveTextToSend, finalSummary, history)
      } else {
        let systemPrompt: string

        if (effectiveWorkspaceContext && workspaceStats.selectedFiles > 0) {
          const additionalContext = action
            ? t('chat.prompt.userRequest', { action: quickActionLabels[action] })
            : ''
          systemPrompt = workspaceContextService.generateSystemPrompt(additionalContext, language)
        } else {
          systemPrompt = action
            ? generateCodePrompt(action, currentCode, language)
            : t('chat.system.default', { code: currentCode })
        }

        systemPrompt = await buildPromptWithSharedContext({
          basePrompt: systemPrompt,
          query: effectiveTextToSend,
          forceSlim,
          applyProjectRules,
          augmentWithSemanticContext,
          applyAgentContext: (prompt) => applyAgentContext(prompt, agentSettings),
          buildMentionSection: (query) =>
            buildMentionContextSection(query, editorFiles, projectIndexManager.getIndex(), language),
        })
        if (planMode) {
          systemPrompt = buildPlanModeSystemPrompt(systemPrompt)
        }

        aiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...history,
          { role: 'user' as const, content: effectiveTextToSend },
        ]
      }

      const estimatedBytes = measureAiMessagesPayload(aiMessages)
      if (payloadMeterEstimate) {
        const parity = comparePayloadEstimateToSend(payloadMeterEstimate.estimatedBytes, estimatedBytes)
        if (!parity.withinTolerance) {
          trackEvent('chat.payload_estimate_drift', {
            meterBytes: payloadMeterEstimate.estimatedBytes,
            sendBytes: estimatedBytes,
            deltaBytes: parity.deltaBytes,
            deltaRatio: Math.round(parity.deltaRatio * 1000) / 1000,
          })
        }
      }
      const budgetBytes = getPayloadBudget(aiConfig.provider)
      const warning = getPayloadWarningData(estimatedBytes, budgetBytes, textToSend, slimPlan)
      if (warning) {
        if (!forceSlim) {
          trackEvent('chat.payload_preflight_warn', {
            estimatedBytes,
            budgetBytes,
            provider: aiConfig.provider,
            agentMode,
            workspaceContext: effectiveWorkspaceContext,
          })
          setPayloadWarning({
            estimatedBytes: warning.estimatedBytes,
            budgetBytes: warning.budgetBytes,
            text: warning.text,
            action,
            slimPlan: warning.slimPlan,
          })
          if (!customInput) setInput(textToSend)
          setMessages((prev) => removeTrailingUserMessage(prev, effectiveTextToSend))
          notify?.(
            'info',
            t('chat.payload.preflightWarnTitle'),
            t('chat.payload.preflightWarnDetail', { estimatedKb: toKb(estimatedBytes), budgetKb: toKb(budgetBytes) }),
          )
          return
        }
        throw new Error(
          t('chat.payload.stillTooLarge', {
            estimatedKb: toKb(estimatedBytes),
            budgetKb: toKb(budgetBytes),
          }),
        )
      }

      await sendMessage(aiConfig, aiMessages, (chunk) => {
        assistantContent += chunk
        setMessages((prev) => upsertAssistantMessage(prev, assistantContent))
      }, { signal: streamAbortRef.current?.signal })

      if (agentMode) {
        const mcpSettings = await loadMcpSettings()
        const mcpTurn = await processAgentMcpTurn({
          content: assistantContent,
          autoFollowUp: mcpSettings.autoFollowUp,
          maxFollowUpRounds: mcpSettings.maxFollowUpRounds,
          sendFollowUp: async ({ assistantSoFar, toolLog }) => {
            let followUpContent = ''
            const followUpMessages = buildMcpFollowUpMessages(
              aiMessages,
              assistantSoFar,
              t('chat.mcp.followUp', { log: toolLog.join('\n') }),
            )
            await sendMessage(aiConfig, followUpMessages, (chunk) => {
              followUpContent += chunk
              setMessages((prev) => upsertAssistantMessage(prev, `${assistantSoFar}\n\n${followUpContent}`))
            }, { signal: streamAbortRef.current?.signal })
            return followUpContent
          },
        })
        assistantContent = mcpTurn.content
        setMcpToolEntries(mcpTurn.toolEntries)
        if (mcpTurn.toolLog.length > 0) {
          assistantContent = `${assistantContent}\n\n${t('chat.mcp.results')}\n${mcpTurn.toolLog.join('\n')}`
        }
        setMessages((prev) => upsertAssistantMessage(prev, assistantContent))
      }

      const agentChanges = parseAgentFileChanges(assistantContent)
      if (planMode) {
        setFiles((prev) => {
          const result = applyPlanArtifactsWithResult(prev, effectiveTextToSend, assistantContent)
          lastPlanPathRef.current = result.planPath
          return result.files
        })
      } else if (agentChanges.length > 0) {
        setPendingAgentChanges(agentChanges)
      } else {
        setPendingAgentChanges(null)
        generateFilesFromResponse(assistantContent)
      }

      if (queuedSpecBackfill) {
        const specBackfill = queuedSpecBackfill
        appendExecutionToSpecAcceptance(
          specBackfill.specAcceptancePath,
          specBackfill.taskText,
          assistantContent,
          executionRunId,
        )
        setQueueSuccessStats((prev) => ({ ...prev, spec: prev.spec + 1 }))
        setRecentDoneQueueItems((prev) => [
          { kind: 'spec' as const, text: specBackfill.taskText },
          ...prev,
        ].slice(0, 5))
        setFailedSpecExecution(null)
        void finishSpecQueueItem(specBackfill)
      }

      if (queuedPlanBackfill) {
        setFiles((prev) =>
          markPlanStepDone(
            appendPlanExecutionBackfill(prev, {
              planPath: queuedPlanBackfill.planPath,
              stepText: queuedPlanBackfill.stepText,
              status: 'success',
              validation: 'completed',
              runId: executionRunId,
              provider: aiConfig.provider,
              model: aiConfig.model || undefined,
              assistantOutput: assistantContent,
            }),
            queuedPlanBackfill.planPath,
            { text: queuedPlanBackfill.stepText, line: queuedPlanBackfill.stepLine },
          ),
        )
        setQueuedPlanBackfill(null)
        setQueueSuccessStats((prev) => ({ ...prev, plan: prev.plan + 1 }))
        setRecentDoneQueueItems((prev) => [
          { kind: 'plan' as const, text: queuedPlanBackfill.stepText },
          ...prev,
        ].slice(0, 5))
        setFailedPlanExecution(null)
      }
      refreshQuota()
    } catch (error: any) {
      const message = error.message || t('chat.unknownError')
      const formatted = formatChatErrorMessage(t, message)

      if (formatted.kind === 'payload') {
        trackEvent('chat.payload_too_large', {
          provider: aiConfig.provider,
          agentMode,
          workspaceContext: useWorkspaceContext,
          indexFiles: indexStats.indexedFiles,
          selectedWorkspaceFiles: workspaceStats.selectedFiles,
          messageCount: messages.length,
        })
      }

      if (formatted.kind !== 'aborted') {
        notify?.('error', t(formatted.kind === 'payload' ? 'chat.error.payloadTooLarge' : 'chat.requestFailed', {
          message: message.split('\n')[0],
        }), message)
      }

      if (queuedPlanBackfill) {
        setFiles((prev) =>
          appendPlanExecutionBackfill(prev, {
            planPath: queuedPlanBackfill.planPath,
            stepText: queuedPlanBackfill.stepText,
            status: 'failed',
            validation: 'error',
            runId,
            provider: aiConfig.provider,
            model: aiConfig.model || undefined,
            assistantOutput: message,
          }),
        )
        setFailedPlanExecution({
          prompt: buildPlanExecutionPrompt(queuedPlanBackfill.stepText),
          backfill: queuedPlanBackfill,
          error: message.split('\n')[0],
        })
        setQueueFailureStats((prev) => ({ ...prev, plan: prev.plan + 1 }))
        setQueuedPlanBackfill(null)
      }

      if (queuedSpecBackfill) {
        setFailedSpecExecution({
          prompt: `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${queuedSpecBackfill.taskPath}] ${queuedSpecBackfill.taskText}`,
          backfill: queuedSpecBackfill,
          error: message.split('\n')[0],
        })
        setQueueFailureStats((prev) => ({ ...prev, spec: prev.spec + 1 }))
        setQueuedSpecBackfill(null)
      }

      appendError(formatted.content)
    } finally {
      setLoading(false)
      setRunId(null)
      streamAbortRef.current = null
    }
  }

  useEffect(() => {
    if (!queuedChatPrompt || loading) return
    void (async () => {
      await handleSend(queuedChatPrompt)
      setQueuedChatPrompt(null)
      setQueuedSpecBackfill(null)
    })()
  }, [queuedChatPrompt, loading, setQueuedChatPrompt, setQueuedSpecBackfill])

  useEffect(() => {
    if (loading || failedSpecExecution || queuedChatPrompt || queuedSpecBackfill || queuedSpecExecutions.length === 0) return
    const next = shiftQueuedSpecExecution()
    if (!next) return
    setQueuedSpecBackfill(next.backfill)
    setQueuedChatPrompt(next.prompt)
  }, [
    failedSpecExecution,
    loading,
    queuedChatPrompt,
    queuedSpecBackfill,
    queuedSpecExecutions.length,
    setQueuedChatPrompt,
    setQueuedSpecBackfill,
    shiftQueuedSpecExecution,
  ])

  useEffect(() => {
    if (queuedSpecExecutions.length > 0) return
    const restored = loadQueuedSpecExecutionsDetailed()
    if (restored.corrupted) {
      notify?.('info', t('queue.persist.corruptedTitle'), t('queue.persist.corruptedDetail'))
    }
    if (restored.items.length > 0) setQueuedSpecExecutions(restored.items)
  }, [notify, queuedSpecExecutions.length, setQueuedSpecExecutions, t])

  useEffect(() => {
    saveQueuedSpecExecutions(queuedSpecExecutions)
  }, [queuedSpecExecutions])

  useEffect(() => {
    if (queuedPlanExecutions.length > 0) return
    const restored = loadQueuedPlanExecutionsDetailed()
    if (restored.corrupted) {
      notify?.('info', t('queue.persist.corruptedTitle'), t('queue.persist.corruptedDetail'))
    }
    if (restored.items.length > 0) setQueuedPlanExecutions(restored.items)
  }, [notify, queuedPlanExecutions.length, setQueuedPlanExecutions, t])

  useEffect(() => {
    saveQueuedPlanExecutions(queuedPlanExecutions)
  }, [queuedPlanExecutions])

  useEffect(() => {
    if (loading || failedPlanExecution || queuedPlanExecutions.length === 0) return
    const next = shiftQueuedPlanExecution()
    if (!next) return
    setQueuedPlanBackfill(next.backfill)
    void handleSend(next.prompt)
  }, [failedPlanExecution, handleSend, loading, queuedPlanExecutions.length, setQueuedPlanBackfill, shiftQueuedPlanExecution])

  useEffect(() => {
    if (loading || sendQueue.length === 0) return
    const shifted = shiftQueue({ status: sessionStatus, runId, queue: sendQueue })
    if (!shifted.next) return
    setSendQueue(shifted.state.queue)
    void handleSend(shifted.next.text, shifted.next.action, shifted.next.options)
  }, [loading, sendQueue])

  const retryFromMessageIndex = useCallback(
    (messageIndex: number) => {
      const userText = findRetryUserText(
        messages.map((message) => ({ role: message.role, content: message.content })),
        messageIndex,
      )
      if (!userText || loading) return
      setMessages((prev) => prev.slice(0, messageIndex))
      void handleSend(userText)
    },
    [handleSend, loading, messages],
  )

  const quickActions = useMemo(
    () => [
      { icon: Code2, label: t('ai.chat.quick.explain'), action: () => handleSend(t('chat.send.explain'), 'explain') },
      { icon: Wand2, label: t('ai.chat.quick.refactor'), action: () => handleSend(t('chat.send.refactor'), 'refactor') },
      { icon: Sparkles, label: t('ai.chat.quick.fix'), action: () => handleSend(t('chat.send.fix'), 'fix') },
      { icon: FilePlus, label: t('ai.chat.quick.generate'), action: () => handleSend(t('chat.send.generate'), 'generate') },
    ],
    [t],
  )

  const runFirstPlanStep = useCallback(() => {
    if (loading) return
    const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant' && !message.isError)
    if (!latestAssistant) return
    const firstStep = getFirstPlanStep(latestAssistant.content)
    if (!firstStep) return
    if (!lastPlanPathRef.current) return
    const prompt = buildPlanExecutionPrompt(firstStep)
    setQueuedPlanBackfill({ planPath: lastPlanPathRef.current, stepText: firstStep })

    setPlanMode(false)
    setAgentMode(true)
    try {
      localStorage.setItem('ai-ide:chat-plan-mode', 'false')
      localStorage.setItem('ai-ide:chat-agent-mode', 'true')
    } catch {
      // ignore persistence failure
    }
    void handleSend(prompt)
  }, [handleSend, loading, messages, setQueuedPlanBackfill])

  const pickMention = (hit: IndexSearchHit) => {
    const label =
      hit.type === 'symbol' && hit.path
        ? `${hit.path}#${hit.name}`
        : hit.path || hit.name
    const cursor = inputRef.current?.selectionStart ?? input.length
    const next = insertMention(input, cursor, label)
    setInput(next.text)
    setMentionHits([])
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(next.cursor, next.cursor)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionHits.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setMentionIndex((prev) => Math.min(prev + 1, mentionHits.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setMentionIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && mentionHits[mentionIndex])) {
        event.preventDefault()
        pickMention(mentionHits[mentionIndex])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMentionHits([])
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value
    setInput(next)
    refreshMentionHits(next, event.target.selectionStart ?? next.length)
  }

  return (
    <div
      className={`chat-container chat-panel chat-panel--v2 ${embeddedInRightPanel ? 'chat-panel--embedded' : ''} ${mounted ? 'chat-panel--mounted' : ''}`}
    >
      <div
        className={`chat-panel-header chat-panel-header--dense ${embeddedInRightPanel ? 'chat-panel-header--embedded' : ''}`}
      >
        <div className="chat-header-grid">
          <div className="chat-header-grid__meta">
            <div className="chat-control-strip__chips" title={t('chat.sessionTitle')}>
              <span
                className="chat-chip chat-chip--model chat-chip--model-combo"
                title={`${aiConfig.provider}${aiConfig.model ? ` / ${aiConfig.model}` : ''}`}
              >
                {aiConfig.model ? `${aiConfig.provider} · ${aiConfig.model}` : aiConfig.provider}
              </span>
              <span
                className={`chat-chip ${isConfigured ? 'chat-chip--success' : 'chat-chip--warning'}`}
                title={
                  isConfigured
                    ? t('chat.configured')
                    : needsPlatformSignIn
                      ? t('chat.pendingPlatformSignIn')
                      : t('chat.pendingConfig')
                }
              >
                {isConfigured
                  ? t('chat.configuredShort')
                  : needsPlatformSignIn
                    ? t('chat.pendingPlatformSignInShort')
                    : t('chat.pendingConfigShort')}
              </span>
            </div>

            <QuotaIndicator quota={quota} label={t('chat.quotaToday')} inline />

            <button
              type="button"
              className="chat-controls-toggle"
              onClick={() => {
                setControlsExpanded((prev) => {
                  const next = !prev
                  try {
                    localStorage.setItem('ai-ide:chat-controls-expanded', String(next))
                  } catch {
                    // ignore
                  }
                  return next
                })
              }}
              aria-expanded={controlsExpanded}
              title={controlsExpanded ? t('chat.controlsCollapse') : t('chat.controlsExpand')}
            >
              {controlsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <div className="chat-mode-segment" role="group" aria-label={t('chat.modesGroup')}>
            <button
              type="button"
              className="chat-mode-segment__btn chat-mode-segment__btn--active"
              title={
                agentMode && supportsAgentToolCalling(aiConfig.provider)
                  ? `${t('chat.agentModeTitle')} · ${t('chat.agentToolsActive')}`
                  : t('chat.agentModeTitle')
              }
              aria-pressed="true"
            >
              <Zap size={13} aria-hidden />
              <span>{t('chat.agent')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlanMode((value) => {
                  const next = !value
                  try {
                    localStorage.setItem('ai-ide:chat-plan-mode', String(next))
                  } catch {
                    // ignore
                  }
                  if (next) {
                    try {
                      localStorage.setItem('ai-ide:chat-agent-mode', 'true')
                    } catch {
                      // ignore
                    }
                  }
                  return next
                })
              }}
              className={`chat-mode-segment__btn ${planMode ? 'chat-mode-segment__btn--active' : ''}`}
              title={planMode ? t('chat.planModeOn') : t('chat.planModeOff')}
              aria-pressed={planMode}
            >
              <ListTodo size={13} aria-hidden />
              <span>{t('chat.planShort')}</span>
            </button>

            <button
              type="button"
              onClick={() => setUseWorkspaceContext((value) => !value)}
              disabled={workspaceStats.selectedFiles === 0}
              className={`chat-mode-segment__btn ${useWorkspaceContext ? 'chat-mode-segment__btn--active' : ''}`}
              title={
                workspaceStats.selectedFiles === 0
                  ? t('chat.workspaceEmpty')
                  : t('chat.workspaceSelected', { count: workspaceStats.selectedFiles })
              }
              aria-pressed={useWorkspaceContext}
            >
              <FolderOpen size={13} aria-hidden />
              <span>
                {t('chat.workspaceShort')}
                {workspaceStats.selectedFiles > 0 ? ` (${workspaceStats.selectedFiles})` : ''}
              </span>
              {useWorkspaceContext ? <CheckSquare size={11} className="chat-mode-segment__badge" aria-hidden /> : null}
            </button>
          </div>
        </div>

        {controlsExpanded ? (
          <div className="chat-panel-header__details">
            {!embeddedInRightPanel ? (
              <div className="chat-session-card__title chat-session-card__title--inline">
                <Bot size={14} color="var(--accent-color)" />
                <strong>{t('chat.sessionTitle')}</strong>
              </div>
            ) : null}
            {(indexStats.indexedFiles > 0 ||
              indexBuildState.status === 'building' ||
              indexBuildState.status === 'error') && (
              <p className="chat-index-hint" title={t('chat.indexHintTitle')}>
                {indexBuildState.status === 'building' ? (
                  indexBuildState.progress
                    ? t('chat.indexBuildingProgress', {
                        indexed: indexBuildState.progress.indexed,
                        total: indexBuildState.progress.total,
                      })
                    : t('chat.indexBuilding')
                ) : indexBuildState.status === 'error' ? (
                  <>
                    {t('chat.indexError', { message: indexBuildState.lastError ?? '' })}{' '}
                    <button
                      type="button"
                      className="chat-index-retry"
                      onClick={() => {
                        const files = editorFiles.map((f) => ({
                          name: f.name,
                          content: f.content,
                          language: f.language,
                        }))
                        projectIndexManager.forceRebuildFromWorkspace(files)
                      }}
                    >
                      {t('chat.indexRetry')}
                    </button>
                  </>
                ) : indexStats.capped ? (
                  t('chat.indexCapped', {
                    indexed: indexStats.indexedFiles,
                    eligible: indexStats.eligibleFiles,
                  })
                ) : (
                  t('chat.indexOk', { count: indexStats.indexedFiles })
                )}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {subscriptionExpiredBanner && (
        <div className="chat-subscription-expired" role="status">
          {subscriptionExpiredBanner}
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message, index) => {
          const isAssistant = message.role === 'assistant'
          const isWelcome = index === 0 && isAssistant && !message.isError
          const lastAssistantIndex = messages.reduce(
            (last, item, itemIndex) => (item.role === 'assistant' ? itemIndex : last),
            -1,
          )
          const canRetry = isAssistant && !isWelcome && !message.isError && index > 0
          const canContinue =
            isAssistant && !isWelcome && !message.isError && index === lastAssistantIndex && !loading

          return (
            <div key={index} className={`chat-msg-stack ${isAssistant ? '' : 'chat-msg-stack--user'}`}>
              <div className={`chat-msg-row ${isAssistant ? '' : 'chat-msg-row--user'}`}>
                {isAssistant && (
                  <div className="chat-msg-avatar chat-msg-avatar--assistant">
                    <Bot size={14} color="#c4b5fd" />
                  </div>
                )}

                <div
                  className={`chat-msg-bubble ${isAssistant ? 'chat-msg-bubble--assistant' : 'chat-msg-bubble--user'} ${message.isError ? 'chat-msg-bubble--error' : ''}`}
                >
                  <ChatMessageBody
                    content={message.content}
                    variant={message.role}
                    isError={message.isError}
                  />
                </div>

                {!isAssistant && (
                  <div className="chat-msg-avatar chat-msg-avatar--user">
                    <User size={14} color="#5ee9b5" />
                  </div>
                )}
              </div>

              {!isWelcome ? (
                <ChatMessageActions
                  role={message.role}
                  canRetry={canRetry}
                  canContinue={canContinue}
                  onCopy={() => void copyMessageText(message.content)}
                  onRetry={canRetry ? () => retryFromMessageIndex(index) : undefined}
                  onContinue={
                    canContinue
                      ? () => void handleSend(t('chat.action.continuePrompt'))
                      : undefined
                  }
                />
              ) : null}
            </div>
          )
        })}

        {loading && (
          <div className="chat-loading-row">
            <div className="chat-msg-avatar chat-msg-avatar--assistant">
              <Bot size={14} color="#c4b5fd" />
            </div>
            <div className="chat-loading-bubble">
              <div className="chat-loading-bubble__inner">
                <span>{t('chat.thinking')}</span>
                <span className="typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
              <AgentToolPanel
                activity={agentActivity}
                defaultCollapsed={false}
                onSaveRun={() => void saveCurrentRun()}
                onReplayLastRun={() => void replayLastRun()}
                onExportMarkdown={exportRunMarkdown}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {pendingAgentChanges && pendingAgentChanges.length > 0 && onGenerateFiles ? (
        <div className="chat-agent-bar">
          <span className="chat-agent-bar__text">
            {t('chat.agentChanges', {
              count: pendingAgentChanges.length,
              paths: pendingAgentChanges.map((c) => c.path).join('、'),
            })}
          </span>
          <div className="chat-agent-bar__actions">
            <button type="button" className="chat-btn-ghost" onClick={() => setPendingAgentChanges(null)}>
              {t('chat.ignore')}
            </button>
            <button
              type="button"
              className="chat-btn-ghost"
              onClick={() => {
                setAgentApplyQueue(
                  pendingAgentChanges.map((change) => ({
                    path: change.path,
                    oldContent: getOldContentForPath(editorFiles, change.path),
                    newContent: change.content,
                    language: change.language,
                  })),
                )
                setShowAgentApplyModal(true)
                setPendingAgentChanges(null)
              }}
            >
              {t('chat.preview')}
            </button>
            <button
              type="button"
              className="chat-btn-primary-sm"
              onClick={() => {
                onGenerateFiles(
                  pendingAgentChanges.map((change) => ({
                    name: change.path,
                    content: change.content,
                    language: change.language,
                  })),
                )
                setPendingAgentChanges(null)
              }}
            >
              {t('chat.apply')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="chat-quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="chat-quick-btn"
            onClick={action.action}
            disabled={loading || !isConfigured}
          >
            <action.icon size={14} />
            {action.label}
          </button>
        ))}
        {planMode ? (
          <button
            type="button"
            className="chat-quick-btn"
            onClick={runFirstPlanStep}
            disabled={loading}
            title="执行计划中的第一步"
          >
            执行第一步
          </button>
        ) : null}
      </div>

      <McpToolLogPanel entries={mcpToolEntries} />

      {(!loading && (runtimeQueuePause || queuedChatPrompt || queuedPlanExecutions.length > 0 || queuedSpecExecutions.length > 0 || sendQueue.length > 0)) || (loading && sendQueue.length > 0) ? (
        <TaskQueuePanel
          sessionStatus={sessionStatus}
          runId={runId}
          activeQueueTask={activeQueueTask}
          queuedChatPrompt={queuedChatPrompt}
          queuedPlanExecutions={queuedPlanExecutions}
          queuedSpecExecutions={queuedSpecExecutions}
          sendQueue={sendQueue}
          queueFailureStats={queueFailureStats}
          queueSuccessStats={queueSuccessStats}
          recentDoneQueueItems={recentDoneQueueItems}
          failedPlanExecution={failedPlanExecution}
          failedSpecExecution={failedSpecExecution}
          runtimeQueuePause={runtimeQueuePause}
          onResumeRuntimeQueue={() => {
            clearRuntimeQueuePause()
            notify?.('success', t('runtime.queuePaused.resumedTitle'), t('runtime.queuePaused.resumedDetail'))
          }}
          onExportReport={exportQueueReport}
          onSaveReport={saveQueueReportToWorkspace}
          onOpenLatestReport={openLatestQueueReport}
          onRestoreFromLatestReport={restoreQueueFromLatestReport}
          onResetFailureStats={() => setQueueFailureStats({ plan: 0, spec: 0 })}
          onResetSuccessStats={() => setQueueSuccessStats({ plan: 0, spec: 0 })}
          onClearSpecQueue={() => setQueuedSpecExecutions([])}
          onClearPlanQueue={() => setQueuedPlanExecutions([])}
          onRetryFailedPlan={() => {
            if (!failedPlanExecution) return
            setQueuedPlanBackfill(failedPlanExecution.backfill)
            setFailedPlanExecution(null)
            void handleSend(failedPlanExecution.prompt)
          }}
          onSkipFailedPlan={() => setFailedPlanExecution(null)}
          onRetryFailedSpec={() => {
            if (!failedSpecExecution) return
            setQueuedSpecBackfill(failedSpecExecution.backfill)
            setFailedSpecExecution(null)
            void handleSend(failedSpecExecution.prompt)
          }}
          onSkipFailedSpec={() => setFailedSpecExecution(null)}
        />
      ) : null}

      <div className="chat-input-area chat-input-area--stacked">
        {payloadMeterEstimate ? (
          <ChatPayloadBudgetMeter
            estimatedBytes={payloadMeterEstimate.estimatedBytes}
            budgetBytes={payloadMeterEstimate.budgetBytes}
            usagePercent={payloadMeterEstimate.usagePercent}
            level={payloadMeterEstimate.level}
            footnote={[
              payloadEstimate?.semanticReserveBytes ? t('chat.payload.meterSemanticNote') : null,
              payloadEstimate?.toolLoopReserveBytes ? t('chat.payload.meterToolLoopNote') : null,
              payloadEstimate?.mcpReserveBytes ? t('chat.payload.meterMcpNote') : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
        ) : null}

        {showLargeRepoHint && largeRepoHint ? (
          <div className="chat-large-repo-hint" role="status">
            <strong>{t('chat.indexHintTitle')}</strong>
            {largeRepoHint.kind === 'capped'
              ? t('chat.largeRepo.capped', {
                  indexed: largeRepoHint.indexedFiles,
                  eligible: largeRepoHint.eligibleFiles,
                })
              : t('chat.largeRepo.nearCap', {
                  indexed: largeRepoHint.indexedFiles,
                  eligible: largeRepoHint.eligibleFiles,
                  max: largeRepoHint.maxFiles,
                })}
          </div>
        ) : null}

        {mentionPreflight && mentionPreflight.issues.length > 0 ? (
          <div className="chat-mention-preflight" role="status">
            <strong>{t('chat.mention.preflightBannerTitle')}</strong>
            <ul>
              {mentionPreflight.issues.map((issue) => {
                if (issue.kind === 'too_many') {
                  return (
                    <li key="too-many">
                      {t('chat.mention.preflightTooMany', { count: issue.count, max: issue.max })}
                    </li>
                  )
                }
                if (issue.kind === 'unresolved') {
                  return <li key={`unresolved-${issue.token}`}>{t('chat.mention.preflightUnresolved', { tokens: issue.token })}</li>
                }
                return (
                  <li key={`ambiguous-${issue.token}`}>
                    {t('chat.mention.preflightAmbiguous', {
                      token: issue.token,
                      paths: issue.paths.join(', '),
                    })}
                  </li>
                )
              })}
            </ul>
            {countUnresolvedMentions(mentionPreflight) > 0 ? (
              <span>{t('chat.mention.preflightBlockHint')}</span>
            ) : null}
            {countAmbiguousMentions(mentionPreflight) > 0 ? (
              <span>{t('chat.mention.preflightAmbiguousBlockHint')}</span>
            ) : null}
            {countAmbiguousMentions(mentionPreflight) > 0 &&
            countUnresolvedMentions(mentionPreflight) === 0 ? (
              <button
                type="button"
                className="chat-btn-primary-sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  trackEvent('chat.mention_slim_retry', {
                    ambiguousCount: countAmbiguousMentions(mentionPreflight),
                  })
                  handleSend(input, undefined, { forceSlim: true })
                }}
              >
                {t('chat.mention.slimPastAmbiguous')}
              </button>
            ) : null}
          </div>
        ) : null}

        {payloadWarning ? (
          <div className="chat-payload-warning" role="status">
            <div className="chat-payload-warning__text">
              <strong>{t('chat.payload.preflightWarnTitle')}</strong>
              <span>
                {t('chat.payload.preflightWarnDetail', {
                  estimatedKb: toKb(payloadWarning.estimatedBytes),
                  budgetKb: toKb(payloadWarning.budgetBytes),
                })}
              </span>
              <span className="chat-payload-warning__plan">
                {payloadWarning.slimPlan.join(' · ')}
              </span>
            </div>
            <button
              type="button"
              className="chat-btn-primary-sm"
              onClick={() => {
                trackEvent('chat.payload_slim_retry', {
                  estimatedBytes: payloadWarning.estimatedBytes,
                  budgetBytes: payloadWarning.budgetBytes,
                  provider: aiConfig.provider,
                })
                handleSend(payloadWarning.text, payloadWarning.action, { forceSlim: true })
              }}
            >
              {t('chat.payload.slimAndSend')}
            </button>
          </div>
        ) : null}

        {activeMentionQuery !== null && mentionBlockedByIndexBuild ? (
          <div
            className="chat-mention-list"
            style={{
              padding: '10px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              marginBottom: '8px',
            }}
            role="status"
          >
            {t('chat.mentionBuildingBlocked')}
          </div>
        ) : null}

        {mentionHits.length > 0 && (
          <div className="chat-mention-list">
            {mentionHits.map((hit, index) => (
              <button
                key={`${hit.type}-${hit.path}-${hit.name}-${hit.line ?? 0}`}
                type="button"
                className={`chat-mention-item ${index === mentionIndex ? 'chat-mention-item--active' : ''}`}
                onClick={() => pickMention(hit)}
              >
                <span style={{ opacity: 0.7 }}>{hit.type === 'symbol' ? '◎' : '📄'}</span>
                <span>{hit.type === 'symbol' ? hit.name : hit.path}</span>
                {hit.line ? (
                  <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {hit.path}:{hit.line}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {activeMentionQuery !== null &&
        !mentionOnboardingDismissed &&
        indexStats.indexedFiles >= 10 &&
        mentionHits.length === 0 &&
        indexBuildState.status === 'ready' ? (
          <div
            style={{
              marginBottom: '10px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>{t('chat.mentionOnboardingTitle')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
              {t('chat.mentionOnboardingBody')}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              onClick={() => {
                setMentionOnboardingDismissed(true)
                try {
                  localStorage.setItem('ai-ide:mention-onboarding-dismissed', 'true')
                } catch {
                  // ignore
                }
              }}
            >
              {t('chat.mentionOnboardingDismiss')}
            </button>
          </div>
        ) : null}

        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input chat-input--composer"
            placeholder={
              isConfigured ? t('chat.inputPlaceholder') : t('chat.inputPlaceholderNoConfig')
            }
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isConfigured || loading}
            rows={1}
          />
          {backgroundAgentOn && agentMode && !planMode && currentUser ? (
            <button
              type="button"
              className="chat-send chat-send--square"
              onClick={() => void handleBackgroundRun()}
              disabled={!isConfigured || loading || backgroundSubmitting || !input.trim()}
              title={t('chat.backgroundRun.button')}
            >
              <Server size={16} />
            </button>
          ) : null}
          <button
            type="button"
            className="chat-send chat-send--square"
            onClick={loading ? stopGeneration : () => handleSend()}
            disabled={!isConfigured || (!loading && !input.trim())}
            title={loading ? t('chat.stop') : t('chat.sendButton')}
          >
            {loading ? <Pause size={16} /> : <Send size={16} />}
          </button>
        </div>
      </div>

    </div>
  )
}

export default ChatPanel
