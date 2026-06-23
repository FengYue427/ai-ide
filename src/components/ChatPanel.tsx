import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ChatPanelHeader } from './ChatPanelHeader'
import {
  Code2,
  FilePlus,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {
  appendMcpToolsToPrompt,
  buildMcpToolsPromptSection,
} from '../services/mcpAgentBridge'
import type { AgentFileChange } from '../services/agentApplyService'
import {
  type AIConfig,
  type QuotaCheck,
} from '../services/aiService'
import { appendAgentContextSections } from '../services/agentContextService'
import { loadAgentSettings } from '../services/agentSettingsService'
import type { AgentActivityEntry } from '../services/agentRunner'
import { BILLING_SYNC_EVENT } from '../hooks/useBillingSync'
import { fetchAIQuota } from '../services/usageService'
import { workspaceContextService } from '../services/workspaceContextService'
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
import { canUseEmbeddings } from '../services/embeddingService'
import { isSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { buildSemanticContextSection } from '../services/semanticSearchService'
import { collectSearchableFiles } from '../services/searchService'
import { McpToolLogPanel } from './McpToolLogPanel'
import { useI18n } from '../i18n'
import { isAiConfigured, isAiGatewayEnabled } from '../lib/aiPlatformMode'
import { shouldShowIntentShell } from '../lib/intentShellFeatures'
import { useIDEStore } from '../store/ideStore'
import { appendSpecsContext, collectSpecSources } from '../services/specsService'
import type { McpToolLogEntry } from '../services/mcpAgentBridge'
import type { ChatSessionStatus, PendingSend } from '../services/chatSessionOrchestrator'
import { buildPromptWithSharedContext } from '../services/chatPromptPipeline'
import { buildPlanExecutionPrompt, getFirstPlanStep } from '../services/planExecutionService'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { createBackgroundJob } from '../services/backgroundJobsApiService'
import { ChatRuntimeQueueSection } from './chat/ChatRuntimeQueueSection'
import { ChatInputComposer } from './chat/ChatInputComposer'
import { ChatQuickActionsBar } from './chat/ChatQuickActionsBar'
import { ChatPendingAgentBar } from './chat/ChatPendingAgentBar'
import { ChatMessagesList } from './chat/ChatMessagesList'
import {
  loadQueueSessionStats,
  saveQueueSessionStats,
} from '../services/queueSessionStatsPersistenceService'
import {
  useChatSendOrchestrator,
  type ChatMessage,
  type ChatPayloadWarning,
} from '../hooks/useChatSendOrchestrator'
import { useChatQueueReport } from '../hooks/useChatQueueReport'
import { useChatAgentRunHistory } from '../hooks/useChatAgentRunHistory'
import { useChatPayloadEstimate } from '../hooks/useChatPayloadEstimate'
import { useChatMentionComposer } from '../hooks/useChatMentionComposer'
import type { ChatPendingAttachment } from '../lib/chatAttachments'
import {
  clearRuntimeQueuePause,
  getRuntimeQueuePause,
  subscribeRuntimeQueuePause,
} from '../services/runtime/runtimeQueuePause'
import {
  applySpecBundleToFiles,
  promoteConversationToSpecBundle,
} from '../services/intentOs/vibeToSpecService'
import {
  isIntentDemoSpecPath,
  markIntentDemoLevelComplete,
} from '../services/intentOs/intentDemoAcceptanceService'
import { onSpecQueueItemSucceeded } from '../services/runtime/runtimeQueueCoordinator'
import { enqueueFirstOpenSpecTaskViaRuntime } from '../services/specTaskExecutionService'
import { useSpecQueueCoordinatorDeps } from '../hooks/useSpecQueueCoordinatorDeps'
import { patchOpenChatPanel } from '../lib/workbenchLayout'
import { PromoteToSpecModal } from './PromoteToSpecModal'

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
  const planDisplayName = useMemo(() => {
    if (currentPlan === 'free' || currentPlan === 'pro' || currentPlan === 'enterprise') {
      return t(`subscription.plan.${currentPlan}.name`)
    }
    return currentPlan
  }, [currentPlan, t])
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
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const lastGroundingBlock = useIDEStore((s) => s.lastGroundingBlock)
  const setLastGroundingBlock = useIDEStore((s) => s.setLastGroundingBlock)
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
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  const setSpecStudioPrefill = useIDEStore((s) => s.setSpecStudioPrefill)
  const setShowSpecStudio = useIDEStore((s) => s.setShowSpecStudio)
  const setSettingsCenterTab = useIDEStore((s) => s.setSettingsCenterTab)
  const setShowSettingsCenter = useIDEStore((s) => s.setShowSettingsCenter)
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)
  const specQueueDeps = useSpecQueueCoordinatorDeps()
  const [promoteModal, setPromoteModal] = useState<{ messageIndex: number; defaultName: string } | null>(null)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[]
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
  const [chatAttachments, setChatAttachments] = useState<ChatPendingAttachment[]>([])
  const [sendQueue, setSendQueue] = useState<PendingSend[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const sessionStatus: ChatSessionStatus = useMemo(() => {
    if (loading) return 'running'
    if (sendQueue.length > 0 || queuedChatPrompt || queuedPlanExecutions.length > 0 || queuedSpecExecutions.length > 0) return 'queued'
    return 'idle'
  }, [loading, queuedChatPrompt, queuedPlanExecutions.length, queuedSpecExecutions.length, sendQueue.length])
  const activeQueueTask = useMemo(() => {
    if (queuedPlanBackfill) return t('chat.queue.activePlan', { text: queuedPlanBackfill.stepText })
    if (queuedSpecBackfill) return t('chat.queue.activeSpec', { text: queuedSpecBackfill.taskText })
    if (loading) return t('chat.queue.processing')
    return null
  }, [loading, queuedPlanBackfill, queuedSpecBackfill, t])

  const [pendingAgentChanges, setPendingAgentChanges] = useState<AgentFileChange[] | null>(null)
  const [agentActivity, setAgentActivity] = useState<AgentActivityEntry[]>([])
  const [lastRunRounds, setLastRunRounds] = useState(0)
  const [mcpToolEntries, setMcpToolEntries] = useState<McpToolLogEntry[]>([])
  const [subscriptionExpiredBanner, setSubscriptionExpiredBanner] = useState<string | null>(null)
  const [payloadWarning, setPayloadWarning] = useState<ChatPayloadWarning | null>(null)
  const failedPlanExecution = useIDEStore((s) => s.failedPlanExecution)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)
  const setFailedPlanExecution = useIDEStore((s) => s.setFailedPlanExecution)
  const setFailedSpecExecution = useIDEStore((s) => s.setFailedSpecExecution)
  const queueFailureStats = useIDEStore((s) => s.queueFailureStats)
  const setQueueFailureStats = useIDEStore((s) => s.setQueueFailureStats)
  const queueSuccessStats = useIDEStore((s) => s.queueSuccessStats)
  const setQueueSuccessStats = useIDEStore((s) => s.setQueueSuccessStats)
  const recentDoneQueueItems = useIDEStore((s) => s.recentDoneQueueItems)
  const setRecentDoneQueueItems = useIDEStore((s) => s.setRecentDoneQueueItems)
  const intentShellEnabled = useIDEStore((s) => s.intentShellEnabled)
  const hideIntentShellQueue = shouldShowIntentShell(editorFiles, intentShellEnabled)
  const [queueSessionStatsHydrated, setQueueSessionStatsHydrated] = useState(false)
  const [indexVersion, setIndexVersion] = useState(() => projectIndexManager.getVersion())
  const indexStats = useMemo(() => projectIndexManager.getIndexStats(), [indexVersion])
  const indexBuildState = useMemo(() => projectIndexManager.getBuildState(), [indexVersion])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [quota, setQuota] = useState<QuotaCheck>({
    allowed: true,
    used: 0,
    limit: 50,
    remaining: 50,
    plan: currentPlan,
  })

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

  const {
    payloadEstimate,
    payloadMeterEstimate,
    mentionPreflight,
    largeRepoHint,
    showLargeRepoHint,
  } = useChatPayloadEstimate({
    aiConfig,
    isConfigured,
    input,
    messagesLength: messages.length,
    chatHistoryMessages,
    agentMode,
    planMode,
    useWorkspaceContext,
    workspaceSelectedFiles: workspaceStats.selectedFiles,
    currentCode,
    editorFiles,
    indexVersion,
    indexStats,
    activeFilePath,
    applyProjectRules,
    language,
    t,
  })

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

  const { handleSend, stopGeneration, retryFromMessageIndex } = useChatSendOrchestrator({
    aiConfig,
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    sendQueue,
    setSendQueue,
    runId,
    setRunId,
    agentActivity,
    setAgentActivity,
    mcpToolEntries,
    setMcpToolEntries,
    payloadWarning,
    setPayloadWarning,
    pendingAgentChanges,
    setPendingAgentChanges,
    lastRunRounds,
    setLastRunRounds,
    failedPlanExecution,
    setFailedPlanExecution,
    failedSpecExecution,
    setFailedSpecExecution,
    setQueueFailureStats,
    setQueueSuccessStats,
    setRecentDoneQueueItems,
    agentMode,
    planMode,
    useWorkspaceContext,
    workspaceStats,
    currentCode,
    currentPlan,
    currentUser,
    isConfigured,
    chatConfigHint,
    quickActionLabels,
    payloadMeterEstimate,
    editorFiles,
    language,
    t,
    notify,
    onGenerateFiles,
    buildAgentWorkspaceSummary,
    refreshQuota,
    setQuota,
    indexStats,
    lastPlanPathRef,
    applyProjectRules,
    augmentWithSemanticContext,
    applyAgentContext,
    queuedChatPrompt,
    setQueuedChatPrompt,
    queuedSpecBackfill,
    setQueuedSpecBackfill,
    queuedSpecExecutions,
    setQueuedSpecExecutions,
    shiftQueuedSpecExecution,
    queuedPlanBackfill,
    setQueuedPlanBackfill,
    queuedPlanExecutions,
    setQueuedPlanExecutions,
    shiftQueuedPlanExecution,
    setFiles,
    sessionStatus,
  })

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

  const { copyMessageText, saveCurrentRun, replayLastRun, exportRunMarkdown } = useChatAgentRunHistory({
    messages,
    setMessages,
    agentActivity,
    lastRunRounds,
    pendingAgentChanges,
    setAgentActivity,
    setPendingAgentChanges,
    notify,
    t,
  })

  const {
    exportQueueReport,
    saveQueueReportToWorkspace,
    saveProofOfDoneToWorkspace,
    openLatestQueueReport,
    restoreQueueFromLatestReport,
  } = useChatQueueReport({
    sessionStatus,
    runId,
    activeQueueTask,
    loading,
    sendQueue,
    queuedChatPrompt,
    queuedSpecBackfill,
    queuedSpecExecutions,
    queuedPlanBackfill,
    queuedPlanExecutions,
    failedPlanExecution,
    failedSpecExecution,
    queueFailureStats,
    queueSuccessStats,
    recentDoneQueueItems,
    editorFiles,
    setFiles,
    setActiveFile,
    setFailedPlanExecution,
    setFailedSpecExecution,
    setQueuedChatPrompt,
    setQueuedPlanBackfill,
    setQueuedSpecBackfill,
    setQueuedPlanExecutions,
    setQueuedSpecExecutions,
    copyMessageText,
    notify,
    t,
  })

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

  const handlePromoteToSpec = useCallback(
    (messageIndex: number) => {
      const turns = messages
        .slice(0, messageIndex + 1)
        .filter((message) => !message.isError)
        .map((message) => ({ role: message.role, content: message.content }))
      const firstUser = turns.find((message) => message.role === 'user')
      const defaultName = (firstUser?.content.split('\n')[0] ?? 'from-chat').slice(0, 48).trim()
      setPromoteModal({ messageIndex, defaultName })
    },
    [messages],
  )

  const handlePromoteConfirm = useCallback(
    (options: { specName: string; runFirstTask: boolean; openStudio: boolean }) => {
      if (!promoteModal) return
      const turns = messages
        .slice(0, promoteModal.messageIndex + 1)
        .filter((message) => !message.isError)
        .map((message) => ({ role: message.role, content: message.content }))
      const bundle = promoteConversationToSpecBundle({
        messages: turns,
        specName: options.specName,
        locale: language === 'en-US' ? 'en-US' : 'zh-CN',
      })
      const applied = applySpecBundleToFiles(editorFiles, bundle.files)
      setFiles(applied.files)
      if (applied.firstIndex >= 0) setActiveFile(applied.firstIndex)
      setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
      setSpecStudioPrefill({ specName: bundle.specSlug, templateId: 'ai-agent-task' })
      notify?.('success', t('intent.promote.success'), applied.tasksPath ?? bundle.tasksPath)
      setPromoteModal(null)

      if (options.openStudio) {
        setShowSpecStudio(true)
      }
      if (options.runFirstTask && bundle.tasksPath) {
        void enqueueFirstOpenSpecTaskViaRuntime(
          { tasksPath: bundle.tasksPath, language: language === 'en-US' ? 'en-US' : 'zh-CN' },
          specQueueDeps,
        ).then((result) => {
          if (!result.ok || !result.accepted) {
            notify?.(
              'error',
              t('runtime.queuePaused.title'),
              result.ok ? result.pauseReason : t('spec.host.noOpenTask.detail'),
            )
            return
          }
          useIDEStore.setState(patchOpenChatPanel())
          setRightPanelView('chat')
        })
      }
    },
    [
      editorFiles,
      language,
      messages,
      notify,
      promoteModal,
      setActiveFile,
      setEditorTarget,
      setFiles,
      setRightPanelView,
      setShowSpecStudio,
      setSpecStudioPrefill,
      specQueueDeps,
      t,
    ],
  )

  const openIntentGraph = useCallback(() => {
    setSettingsCenterTab('features')
    setShowSettingsCenter(true)
  }, [setSettingsCenterTab, setShowSettingsCenter])

  const handleMarkIntentDemoComplete = useCallback(async () => {
    if (!failedSpecExecution || !isIntentDemoSpecPath(failedSpecExecution.backfill.taskPath)) return
    const marked = markIntentDemoLevelComplete(editorFiles, failedSpecExecution.backfill)
    if (!marked.ok) {
      notify?.('info', t('intent.demo.markBlocked.title'), t('intent.demo.markBlocked.detail'))
      return
    }
    setFiles(marked.files)
    const verify = await onSpecQueueItemSucceeded(failedSpecExecution.backfill, specQueueDeps)
    if (!verify.verifyOk) {
      setFailedSpecExecution({
        ...failedSpecExecution,
        error: verify.verifyDetail ?? t('runtime.verifyFail.detail'),
      })
      return
    }
    setFailedSpecExecution(null)
    setQueueSuccessStats((prev) => ({ ...prev, spec: prev.spec + 1 }))
    setRecentDoneQueueItems((prev) =>
      [{ kind: 'spec' as const, text: failedSpecExecution.backfill.taskText }, ...prev].slice(0, 5),
    )
    notify?.('success', t('intent.demo.reportGuide.title'), t('intent.demo.reportGuide.detail'))
  }, [
    editorFiles,
    failedSpecExecution,
    notify,
    setFiles,
    setFailedSpecExecution,
    setQueueSuccessStats,
    setRecentDoneQueueItems,
    specQueueDeps,
    t,
  ])

  const {
    mentionHits,
    mentionIndex,
    activeMentionQuery,
    mentionOnboardingDismissed,
    dismissMentionOnboarding,
    pickMention,
    handleKeyDown,
    handleInputChange,
  } = useChatMentionComposer({
    input,
    setInput,
    inputRef,
    indexVersion,
    mentionBlockedByIndexBuild,
    onSend: () => handleSend(),
  })

  return (
    <div
      className={`chat-container chat-panel chat-panel--v2 ${embeddedInRightPanel ? 'chat-panel--embedded' : ''} ${mounted ? 'chat-panel--mounted' : ''}`}
    >
      <ChatPanelHeader
        aiConfig={aiConfig}
        quota={quota}
        planDisplayName={planDisplayName}
        isConfigured={isConfigured}
        needsPlatformSignIn={needsPlatformSignIn}
        controlsExpanded={controlsExpanded}
        onToggleControlsExpanded={() => {
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
        planMode={planMode}
        onTogglePlanMode={() => {
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
        useWorkspaceContext={useWorkspaceContext}
        onToggleWorkspaceContext={() => setUseWorkspaceContext((value) => !value)}
        workspaceSelectedCount={workspaceStats.selectedFiles}
        embeddedInRightPanel={embeddedInRightPanel}
        indexStats={indexStats}
        indexBuildState={indexBuildState}
        editorFiles={editorFiles}
      />

      {subscriptionExpiredBanner && (
        <div className="chat-subscription-expired" role="status">
          {subscriptionExpiredBanner}
        </div>
      )}

      <ChatMessagesList
        messages={messages}
        loading={loading}
        agentActivity={agentActivity}
        messagesEndRef={messagesEndRef}
        onCopyMessage={copyMessageText}
        onRetryFromIndex={retryFromMessageIndex}
        onContinueConversation={() => void handleSend(t('chat.action.continuePrompt'))}
        onSaveRun={() => void saveCurrentRun()}
        onReplayLastRun={() => void replayLastRun()}
        onExportRunMarkdown={exportRunMarkdown}
        onPromoteToSpec={handlePromoteToSpec}
      />

      {pendingAgentChanges && pendingAgentChanges.length > 0 && onGenerateFiles ? (
        <ChatPendingAgentBar
          changes={pendingAgentChanges}
          editorFiles={editorFiles}
          onIgnore={() => setPendingAgentChanges(null)}
          onPreview={(queue) => {
            setAgentApplyQueue(queue)
            setShowAgentApplyModal(true)
            setPendingAgentChanges(null)
          }}
          onApply={(files) => {
            onGenerateFiles(files)
            setPendingAgentChanges(null)
          }}
        />
      ) : null}

      <ChatQuickActionsBar
        actions={quickActions}
        planMode={planMode}
        actionsDisabled={loading || !isConfigured}
        planDisabled={loading}
        onRunFirstPlanStep={runFirstPlanStep}
      />

      <McpToolLogPanel entries={mcpToolEntries} />

      <ChatRuntimeQueueSection
        loading={loading}
        sessionStatus={sessionStatus}
        runId={runId}
        activeQueueTask={activeQueueTask}
        queuedChatPrompt={queuedChatPrompt}
        queuedPlanExecutions={queuedPlanExecutions}
        queuedSpecExecutions={queuedSpecExecutions}
        queuedSpecBackfill={queuedSpecBackfill}
        verifyingSpecBackfill={verifyingSpecBackfill}
        lastGroundingBlock={lastGroundingBlock}
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
        onSaveProof={() => saveProofOfDoneToWorkspace()}
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
        showIntentDemoVerifyBanner={
          Boolean(failedSpecExecution && isIntentDemoSpecPath(failedSpecExecution.backfill.taskPath))
        }
        onMarkIntentDemoComplete={() => void handleMarkIntentDemoComplete()}
        onOpenIntentGraph={openIntentGraph}
        onDismissGroundingBlock={() => setLastGroundingBlock(null)}
        hideWhenIntentShell={hideIntentShellQueue}
      />

      <ChatInputComposer
        inputRef={inputRef}
        input={input}
        isConfigured={isConfigured}
        loading={loading}
        aiConfig={aiConfig}
        payloadMeterEstimate={payloadMeterEstimate}
        payloadEstimate={payloadEstimate}
        showLargeRepoHint={showLargeRepoHint}
        largeRepoHint={largeRepoHint}
        mentionPreflight={mentionPreflight}
        payloadWarning={payloadWarning}
        activeMentionQuery={activeMentionQuery}
        mentionBlockedByIndexBuild={mentionBlockedByIndexBuild}
        mentionHits={mentionHits}
        mentionIndex={mentionIndex}
        mentionOnboardingDismissed={mentionOnboardingDismissed}
        indexStats={indexStats}
        indexBuildState={indexBuildState}
        backgroundAgentOn={backgroundAgentOn}
        agentMode={agentMode}
        planMode={planMode}
        currentUser={currentUser}
        backgroundSubmitting={backgroundSubmitting}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPickMention={pickMention}
        onDismissMentionOnboarding={dismissMentionOnboarding}
        onSend={handleSend}
        onStop={stopGeneration}
        onBackgroundRun={() => void handleBackgroundRun()}
        attachments={chatAttachments}
        onAttachmentsChange={setChatAttachments}
        onAttachmentRejected={(reason) => {
          const detailKey =
            reason === 'limit'
              ? 'chat.attachments.rejectedLimit'
              : reason === 'size'
                ? 'chat.attachments.rejectedSize'
                : 'chat.attachments.rejectedType'
          notify?.('info', t('chat.attachments.rejectedTitle'), t(detailKey))
        }}
      />

      {promoteModal ? (
        <PromoteToSpecModal
          defaultSpecName={promoteModal.defaultName}
          onClose={() => setPromoteModal(null)}
          onConfirm={handlePromoteConfirm}
        />
      ) : null}
    </div>
  )
}

export default ChatPanel
