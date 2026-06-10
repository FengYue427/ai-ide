import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { aiAgentService } from '../services/aiAgentService'
import { processAgentMcpTurn } from '../services/mcpAgentBridge'
import { parseAgentFileChanges, type AgentFileChange } from '../services/agentApplyService'
import {
  extractCodeBlocks,
  generateCodePrompt,
  sendMessage,
  type AIConfig,
  type QuotaCheck,
} from '../services/aiService'
import { supportsAgentToolCalling } from '../services/agentChatCompletion'
import { loadAgentSettings } from '../services/agentSettingsService'
import {
  buildAgentToolMessages,
  formatActivityForChat,
  runAgentLoop,
  type AgentActivityEntry,
} from '../services/agentRunner'
import { fetchAIQuota } from '../services/usageService'
import { workspaceContextService } from '../services/workspaceContextService'
import { buildMentionContextSection } from '../services/mentionContextService'
import type { ToastKind } from '../components/FeedbackCenter'
import { projectIndexManager } from '../services/projectIndexManager'
import { formatChatErrorMessage } from '../services/chatErrorMessages'
import type { TranslateFn, Language } from '../i18n'
import { trackEvent } from '../lib/observability'
import { measureAiMessagesPayload } from '../services/chatPayloadEstimate'
import type { ChatPayloadEstimate } from '../services/chatPayloadEstimate'
import {
  comparePayloadEstimateToSend,
  evaluateSendMentionGate,
} from '../services/chatSendPreflight'
import { runMentionPreflight } from '../services/mentionPreflight'
import { getPayloadBudget, toKb } from '../services/payloadBudget'
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
import { sanitizeChatAssistantOutput } from '../services/chatOutputSanitizer'
import { applyPlanArtifactsWithResult, buildPlanModeSystemPrompt } from '../services/planModeService'
import {
  appendWorkflowSystemAddon,
  buildSpecExecutionPrompt,
} from '../services/planSpecWorkflowService'
import { appendChatUserOutputRules } from '../services/agentPromptShared'
import { buildPlanExecutionPrompt } from '../services/planExecutionService'
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
import { useSpecQueueCoordinatorDeps } from './useSpecQueueCoordinatorDeps'
import { onSpecQueueItemSucceeded } from '../services/runtime/runtimeQueueCoordinator'
import type { QueuedSpecBackfill, QueuedPlanExecution, QueuedSpecExecution } from '../store/ideStore'
import type {
  FailedPlanExecution,
  FailedSpecExecution,
  RecentDoneQueueItem,
} from '../components/TaskQueuePanel'
import type { User as AuthUser } from '../services/authService'
import type { FileItem } from '../types/file'
import type { IndexBuildStats } from '../services/projectIndexService'
import { loadMcpSettings } from '../services/mcpConfigService'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

export type ChatSendAction = 'explain' | 'refactor' | 'fix' | 'generate'

export type ChatSendOptions = {
  forceSlim?: boolean
}

export type ChatPayloadWarning = {
  estimatedBytes: number
  budgetBytes: number
  text: string
  action?: ChatSendAction
  slimPlan: string[]
}

export interface UseChatSendOrchestratorParams {
  aiConfig: AIConfig
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  input: string
  setInput: Dispatch<SetStateAction<string>>
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  sendQueue: PendingSend[]
  setSendQueue: Dispatch<SetStateAction<PendingSend[]>>
  runId: string | null
  setRunId: Dispatch<SetStateAction<string | null>>
  agentActivity: AgentActivityEntry[]
  setAgentActivity: Dispatch<SetStateAction<AgentActivityEntry[]>>
  mcpToolEntries: McpToolLogEntry[]
  setMcpToolEntries: Dispatch<SetStateAction<McpToolLogEntry[]>>
  payloadWarning: ChatPayloadWarning | null
  setPayloadWarning: Dispatch<SetStateAction<ChatPayloadWarning | null>>
  pendingAgentChanges: AgentFileChange[] | null
  setPendingAgentChanges: Dispatch<SetStateAction<AgentFileChange[] | null>>
  lastRunRounds: number
  setLastRunRounds: Dispatch<SetStateAction<number>>
  failedPlanExecution: FailedPlanExecution | null
  setFailedPlanExecution: Dispatch<SetStateAction<FailedPlanExecution | null>>
  failedSpecExecution: FailedSpecExecution | null
  setFailedSpecExecution: Dispatch<SetStateAction<FailedSpecExecution | null>>
  setQueueFailureStats: Dispatch<SetStateAction<{ plan: number; spec: number }>>
  setQueueSuccessStats: Dispatch<SetStateAction<{ plan: number; spec: number }>>
  setRecentDoneQueueItems: Dispatch<SetStateAction<RecentDoneQueueItem[]>>
  agentMode: boolean
  planMode: boolean
  useWorkspaceContext: boolean
  workspaceStats: { selectedFiles: number }
  currentCode: string
  currentPlan: string
  currentUser: AuthUser | null
  isConfigured: boolean
  chatConfigHint: string
  quickActionLabels: Record<ChatSendAction, string>
  payloadMeterEstimate: ChatPayloadEstimate | null
  editorFiles: FileItem[]
  language: Language
  t: TranslateFn
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  onGenerateFiles?: (files: { name: string; content: string; language: string }[]) => void
  buildAgentWorkspaceSummary: (
    userGoal: string,
    actionLabel?: string,
    forceSlim?: boolean,
  ) => Promise<string>
  refreshQuota: () => void
  setQuota: Dispatch<SetStateAction<QuotaCheck>>
  indexStats: IndexBuildStats
  lastPlanPathRef: MutableRefObject<string | null>
  applyProjectRules: (prompt: string) => string
  augmentWithSemanticContext: (basePrompt: string, query: string) => Promise<string>
  applyAgentContext: (
    prompt: string,
    agentSettings: Awaited<ReturnType<typeof loadAgentSettings>>,
  ) => string
  queuedChatPrompt: string | null
  setQueuedChatPrompt: (prompt: string | null) => void
  queuedSpecBackfill: QueuedSpecBackfill | null
  setQueuedSpecBackfill: (backfill: QueuedSpecBackfill | null) => void
  queuedSpecExecutions: QueuedSpecExecution[]
  setQueuedSpecExecutions: (items: QueuedSpecExecution[]) => void
  shiftQueuedSpecExecution: () => QueuedSpecExecution | null
  queuedPlanBackfill: QueuedPlanExecution['backfill'] | null
  setQueuedPlanBackfill: (backfill: QueuedPlanExecution['backfill'] | null) => void
  queuedPlanExecutions: QueuedPlanExecution[]
  setQueuedPlanExecutions: (items: QueuedPlanExecution[]) => void
  shiftQueuedPlanExecution: () => QueuedPlanExecution | null
  setFiles: (files: FileItem[] | ((prev: FileItem[]) => FileItem[])) => void
  sessionStatus: ChatSessionStatus
}

export function useChatSendOrchestrator(params: UseChatSendOrchestratorParams) {
  const {
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
    setAgentActivity,
    setMcpToolEntries,
    setPayloadWarning,
    setPendingAgentChanges,
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
  } = params

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

  const appendError = useCallback(
    (content: string) => {
      setMessages((prev) => [...prev, { role: 'assistant', content, isError: true }])
    },
    [setMessages],
  )

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

  const specQueueDeps = useSpecQueueCoordinatorDeps()

  const finishSpecQueueItem = useCallback(
    async (backfill: QueuedSpecBackfill) => {
      const result = await onSpecQueueItemSucceeded(backfill, specQueueDeps)
      if (!result.verifyOk) {
        notify?.(
          'error',
          t('runtime.verifyFail.title'),
          result.verifyDetail ?? t('runtime.verifyFail.detail'),
        )
      }
    },
    [notify, specQueueDeps, t],
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

  const handleSend = useCallback(
    async (customInput?: string, action?: ChatSendAction, options?: ChatSendOptions) => {
      const textToSend = customInput || input
      if (!textToSend.trim()) return
      if (loading) {
        setSendQueue((prev) =>
          enqueueSend(
            { status: 'running', runId, queue: prev },
            { text: textToSend, action, options },
          ).queue,
        )
        notify?.('info', t('chat.queue.enqueuedTitle'), t('chat.queue.enqueuedDetail', { count: sendQueue.length + 1 }))
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

      const userMessage: ChatMessage = { role: 'user', content: effectiveTextToSend }
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
          agentMode &&
          !(planMode && !queuedPlanBackfill && !queuedSpecBackfill) &&
          agentSettings.useToolLoop &&
          supportsAgentToolCalling(aiConfig.provider)

        const applyQueueWorkflowContext = (summary: string) => {
          if (queuedPlanBackfill) {
            return appendWorkflowSystemAddon(summary, 'plan-exec', language)
          }
          if (queuedSpecBackfill) {
            return appendWorkflowSystemAddon(summary, 'spec-exec', language)
          }
          return summary
        }

        if (agentMode && useToolLoop) {
          let workspaceSummary = await buildAgentWorkspaceSummary(
            effectiveTextToSend,
            action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : undefined,
            forceSlim,
          )
          workspaceSummary = applyQueueWorkflowContext(workspaceSummary)
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

          assistantContent = sanitizeChatAssistantOutput(assistantContent)
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
          let workspaceSummary = await buildAgentWorkspaceSummary(
            effectiveTextToSend,
            action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : undefined,
            forceSlim,
          )
          workspaceSummary = applyQueueWorkflowContext(workspaceSummary)
          const finalSummary = planMode
            ? buildPlanModeSystemPrompt(workspaceSummary, language)
            : appendChatUserOutputRules(workspaceSummary)
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
            systemPrompt = buildPlanModeSystemPrompt(systemPrompt, language)
          } else {
            systemPrompt = appendChatUserOutputRules(systemPrompt)
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
          assistantContent = sanitizeChatAssistantOutput(assistantContent)
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
                followUpContent = sanitizeChatAssistantOutput(followUpContent)
                setMessages((prev) =>
                  upsertAssistantMessage(prev, `${assistantSoFar}\n\n${followUpContent}`),
                )
              }, { signal: streamAbortRef.current?.signal })
              return followUpContent
            },
          })
          assistantContent = mcpTurn.content
          setMcpToolEntries(mcpTurn.toolEntries)
          if (mcpTurn.toolLog.length > 0) {
            assistantContent = `${assistantContent}\n\n${t('chat.mcp.results')}\n${mcpTurn.toolLog.join('\n')}`
          }
          assistantContent = sanitizeChatAssistantOutput(assistantContent)
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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t('chat.unknownError')
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
            prompt: buildSpecExecutionPrompt(
              queuedSpecBackfill.taskPath,
              queuedSpecBackfill.taskText,
              language,
            ),
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
    },
    [
      input,
      loading,
      setSendQueue,
      runId,
      notify,
      t,
      sendQueue.length,
      setInput,
      currentPlan,
      currentUser,
      setQuota,
      appendError,
      isConfigured,
      chatConfigHint,
      setMessages,
      setPayloadWarning,
      setLoading,
      setRunId,
      setAgentActivity,
      setMcpToolEntries,
      editorFiles,
      payloadMeterEstimate,
      aiConfig,
      agentMode,
      useWorkspaceContext,
      messages,
      planMode,
      queuedPlanBackfill,
      queuedSpecBackfill,
      buildAgentWorkspaceSummary,
      quickActionLabels,
      language,
      setLastRunRounds,
      setPendingAgentChanges,
      generateFilesFromResponse,
      onGenerateFiles,
      appendExecutionToSpecAcceptance,
      setQueueSuccessStats,
      setRecentDoneQueueItems,
      setFailedSpecExecution,
      finishSpecQueueItem,
      setFiles,
      setQueuedPlanBackfill,
      setFailedPlanExecution,
      refreshQuota,
      workspaceStats.selectedFiles,
      currentCode,
      applyProjectRules,
      augmentWithSemanticContext,
      applyAgentContext,
      indexStats.indexedFiles,
      setQueueFailureStats,
      setFailedSpecExecution,
      lastPlanPathRef,
    ],
  )

  useEffect(() => {
    if (!queuedChatPrompt || loading) return
    void (async () => {
      await handleSend(queuedChatPrompt)
      setQueuedChatPrompt(null)
      setQueuedSpecBackfill(null)
    })()
  }, [queuedChatPrompt, loading, setQueuedChatPrompt, setQueuedSpecBackfill, handleSend])

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
  }, [loading, sendQueue, sessionStatus, runId, setSendQueue, handleSend])

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
    [handleSend, loading, messages, setMessages],
  )

  return {
    handleSend,
    stopGeneration,
    retryFromMessageIndex,
  }
}
