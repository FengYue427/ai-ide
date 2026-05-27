import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CheckSquare, Code2, FilePlus, FolderOpen, Pause, Send, Sparkles, User, Wand2, Zap } from 'lucide-react'
import { AgentToolPanel } from './AgentToolPanel'
import { aiAgentService } from '../services/aiAgentService'
import {
  appendMcpToolsToPrompt,
  buildMcpToolsPromptSection,
  processAgentMcpTurn,
} from '../services/mcpAgentBridge'
import { loadMcpSettings } from '../services/mcpConfigService'
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
import { loadAgentSettings } from '../services/agentSettingsService'
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
import { useI18n } from '../i18n'
import { trackEvent } from '../lib/observability'
import { getPayloadBudget, toKb } from '../services/payloadBudget'
import { useIDEStore } from '../store/ideStore'
import { isPayloadTooLargeError } from '../services/workspaceLimits'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type SendAction = 'explain' | 'refactor' | 'fix' | 'generate'

type SendOptions = {
  forceSlim?: boolean
}

interface ChatPanelProps {
  aiConfig: AIConfig
  currentCode: string
  onGenerateFiles?: (files: { name: string; content: string; language: string }[]) => void
  notify?: (kind: ToastKind, title: string, detail?: string) => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({ aiConfig, currentCode, onGenerateFiles, notify }) => {
  const { t, language } = useI18n()
  const currentPlan = useIDEStore((s) => s.currentPlan)

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
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const [mounted, setMounted] = useState(false)
  const [useWorkspaceContext, setUseWorkspaceContext] = useState(false)
  const [agentMode, setAgentMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ai-ide:chat-agent-mode')
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })
  const [workspaceStats, setWorkspaceStats] = useState(workspaceContextService.getStats())
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: createWelcomeMessage(aiConfig) }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAgentChanges, setPendingAgentChanges] = useState<AgentFileChange[] | null>(null)
  const [agentActivity, setAgentActivity] = useState<AgentActivityEntry[]>([])
  const [subscriptionExpiredBanner, setSubscriptionExpiredBanner] = useState<string | null>(null)
  const [mentionHits, setMentionHits] = useState<IndexSearchHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [payloadWarning, setPayloadWarning] = useState<{
    estimatedBytes: number
    budgetBytes: number
    text: string
    action?: SendAction
    slimPlan: string[]
  } | null>(null)
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

  const isConfigured = !!aiConfig.apiKey || aiConfig.provider === 'ollama'

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
        setMentionHits([])
        setMentionIndex(0)
        return
      }
      setMentionHits(projectIndexManager.search(query, 8))
      setMentionIndex(0)
    },
    [indexVersion, mentionBlockedByIndexBuild],
  )

  const activeFilePath = editorFiles[activeFileIndex]?.name ?? null

  const applyProjectRules = useCallback(
    (prompt: string) =>
      appendOpenTasksToPrompt(appendProjectRules(prompt, projectRules, language), projectTasks, language),
    [projectRules, projectTasks, language],
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

      const section = await buildSemanticContextSection(query, searchable, aiConfig, language)
      return section ? `${basePrompt}${section}` : basePrompt
    },
    [aiConfig, editorFiles, language, useWorkspaceContext],
  )

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
    setMessages((prev) => [...prev, { role: 'assistant', content }])
  }

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
      appendError(t('chat.needConfig'))
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
    stopRequestedRef.current = false
    streamAbortRef.current?.abort()
    streamAbortRef.current = new AbortController()
    setAgentActivity([])

    try {
      const history = messages
        .slice(1)
        .slice(-historyLimit)
        .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }))

      let aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
      let assistantContent = ''

      const agentSettings = await loadAgentSettings()

      const buildAgentWorkspaceSummary = async () => {
        const base =
          effectiveWorkspaceContext && workspaceStats.selectedFiles > 0
            ? workspaceContextService.generateSystemPrompt(
                action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : '',
                language,
              )
            : t('chat.prompt.editorFile', { code: currentCode })
        const mcpSection = await buildMcpToolsPromptSection()
        let summary = applyAgentContext(
          await augmentWithSemanticContext(applyProjectRules(base), effectiveTextToSend),
          agentSettings,
        )
        const mentionSection = forceSlim
          ? ''
          : buildMentionContextSection(
            effectiveTextToSend,
            editorFiles,
            projectIndexManager.getIndex(),
            language,
          )
        if (mentionSection) summary = `${summary}\n\n${mentionSection}`
        return appendMcpToolsToPrompt(summary, mcpSection)
      }
      const useToolLoop =
        agentMode && agentSettings.useToolLoop && supportsAgentToolCalling(aiConfig.provider)

      if (agentMode && useToolLoop) {
        const workspaceSummary = await buildAgentWorkspaceSummary()
        const toolMessages = buildAgentToolMessages(workspaceSummary, effectiveTextToSend, history)

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
            setMessages((prev) => {
              const next = [...prev]
              const lastMessage = next[next.length - 1]
              if (lastMessage?.role === 'assistant') {
                lastMessage.content = text
              } else {
                next.push({ role: 'assistant', content: text })
              }
              return next
            })
          },
          shouldStop: () => stopRequestedRef.current,
          signal: streamAbortRef.current?.signal,
        })

        assistantContent = result.finalContent
        if (result.activity.length > 0) {
          const log = formatActivityForChat(result.activity, labelActivity)
          assistantContent = assistantContent
            ? `${assistantContent}\n\n---\n${log}`
            : log
        }

        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') {
            last.content = assistantContent
          } else {
            next.push({ role: 'assistant', content: assistantContent })
          }
          return next
        })

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

        refreshQuota()
        return
      }

      if (agentMode) {
        const workspaceSummary = await buildAgentWorkspaceSummary()
        aiMessages = aiAgentService.buildMessages(effectiveTextToSend, workspaceSummary, history)
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

        systemPrompt = applyAgentContext(
          await augmentWithSemanticContext(applyProjectRules(systemPrompt), effectiveTextToSend),
          agentSettings,
        )
        const mentionSection = forceSlim
          ? ''
          : buildMentionContextSection(
            effectiveTextToSend,
            editorFiles,
            projectIndexManager.getIndex(),
            language,
          )
        if (mentionSection) {
          systemPrompt = `${systemPrompt}\n\n${mentionSection}`
        }

        aiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...history,
          { role: 'user' as const, content: effectiveTextToSend },
        ]
      }

      const estimatedBytes = new Blob([JSON.stringify(aiMessages)]).size
      const budgetBytes = getPayloadBudget(aiConfig.provider)
      if (estimatedBytes > budgetBytes) {
        if (!forceSlim) {
          trackEvent('chat.payload_preflight_warn', {
            estimatedBytes,
            budgetBytes,
            provider: aiConfig.provider,
            agentMode,
            workspaceContext: effectiveWorkspaceContext,
          })
          setPayloadWarning({
            estimatedBytes,
            budgetBytes,
            text: textToSend,
            action,
            slimPlan: [
              t('chat.payload.planHistory', { count: historyLimit }),
              t('chat.payload.planInput', { count: 1200 }),
              t('chat.payload.planWorkspace'),
              t('chat.payload.planMention'),
            ],
          })
          if (!customInput) setInput(textToSend)
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'user' && last.content === effectiveTextToSend) next.pop()
            return next
          })
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
        setMessages((prev) => {
          const next = [...prev]
          const lastMessage = next[next.length - 1]
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = assistantContent
          } else {
            next.push({ role: 'assistant', content: assistantContent })
          }
          return next
        })
      }, { signal: streamAbortRef.current?.signal })

      if (agentMode) {
        const mcpSettings = await loadMcpSettings()
        const mcpTurn = await processAgentMcpTurn({
          content: assistantContent,
          autoFollowUp: mcpSettings.autoFollowUp,
          maxFollowUpRounds: mcpSettings.maxFollowUpRounds,
          sendFollowUp: async ({ assistantSoFar, toolLog }) => {
            let followUpContent = ''
            const followUpMessages = [
              ...aiMessages,
              { role: 'assistant' as const, content: assistantSoFar },
              {
                role: 'user' as const,
                content: t('chat.mcp.followUp', { log: toolLog.join('\n') }),
              },
            ]
            await sendMessage(aiConfig, followUpMessages, (chunk) => {
              followUpContent += chunk
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') {
                  last.content = `${assistantSoFar}\n\n${followUpContent}`
                }
                return next
              })
            }, { signal: streamAbortRef.current?.signal })
            return followUpContent
          },
        })
        assistantContent = mcpTurn.content
        if (mcpTurn.toolLog.length > 0) {
          assistantContent = `${assistantContent}\n\n${t('chat.mcp.results')}\n${mcpTurn.toolLog.join('\n')}`
        }
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') last.content = assistantContent
          return next
        })
      }

      const agentChanges = parseAgentFileChanges(assistantContent)
      if (agentChanges.length > 0) {
        setPendingAgentChanges(agentChanges)
      } else {
        setPendingAgentChanges(null)
        generateFilesFromResponse(assistantContent)
      }
      refreshQuota()
    } catch (error: any) {
      if (stopRequestedRef.current || error?.name === 'AbortError' || String(error?.message || '').includes(t('ai.error.aborted'))) {
        appendError(t('ai.error.aborted'))
        return
      }
      const message = error.message || t('chat.unknownError')
      if (isPayloadTooLargeError(message)) {
        trackEvent('chat.payload_too_large', {
          provider: aiConfig.provider,
          agentMode,
          workspaceContext: useWorkspaceContext,
          indexFiles: indexStats.indexedFiles,
          selectedWorkspaceFiles: workspaceStats.selectedFiles,
          messageCount: messages.length,
        })
        const tips = `${t('chat.error.payloadTooLarge')}\n\n${t('chat.error.payloadTooLargeTips')}`
        notify?.('error', t('chat.error.payloadTooLarge'), t('chat.error.payloadTooLargeTips'))
        appendError(tips)
        return
      }
      notify?.('error', t('chat.requestFailed', { message: message.split('\n')[0] }), message)
      appendError(t('chat.requestFailed', { message }))
    } finally {
      setLoading(false)
      streamAbortRef.current = null
    }
  }

  const quickActions = useMemo(
    () => [
      { icon: Code2, label: t('ai.chat.quick.explain'), action: () => handleSend(t('chat.send.explain'), 'explain') },
      { icon: Wand2, label: t('ai.chat.quick.refactor'), action: () => handleSend(t('chat.send.refactor'), 'refactor') },
      { icon: Sparkles, label: t('ai.chat.quick.fix'), action: () => handleSend(t('chat.send.fix'), 'fix') },
      { icon: FilePlus, label: t('ai.chat.quick.generate'), action: () => handleSend(t('chat.send.generate'), 'generate') },
    ],
    [t],
  )

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
    <div className={`chat-container chat-panel chat-panel--v2 ${mounted ? 'chat-panel--mounted' : ''}`}>
      <div className="chat-panel-header">
        <div className="chat-session-card">
          <div className="chat-session-card__title">
            <Bot size={16} color="var(--accent-color)" />
            <strong>{t('chat.sessionTitle')}</strong>
          </div>
          <div className="chat-chips">
            <span className="chat-chip">{aiConfig.provider}</span>
            <span className="chat-chip">{aiConfig.model || t('chat.noModel')}</span>
            <span className={`chat-chip ${isConfigured ? 'chat-chip--success' : 'chat-chip--warning'}`}>
              {isConfigured ? t('chat.configured') : t('chat.pendingConfig')}
            </span>
          </div>
        </div>

        <div className="chat-toolbar-row">
          <QuotaIndicator quota={quota} label={t('chat.quotaToday')} compact showPlan />

          <button
            type="button"
            onClick={() => {
              setAgentMode((value) => {
                const next = !value
                try {
                  localStorage.setItem('ai-ide:chat-agent-mode', String(next))
                } catch {
                  // ignore persistence failure
                }
                return next
              })
            }}
            className={`chat-mode-btn ${agentMode ? 'chat-mode-btn--active' : ''}`}
            title={t('chat.agentModeTitle')}
          >
            <Zap size={14} color={agentMode ? 'var(--accent-color)' : 'var(--text-secondary)'} />
            <span>
              {t('chat.agent')}
              {agentMode ? ` ${t('chat.agentOn')}` : ''}
              {agentMode && supportsAgentToolCalling(aiConfig.provider)
                ? ` · ${t('chat.agentToolsActive')}`
                : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUseWorkspaceContext((value) => !value)}
            disabled={workspaceStats.selectedFiles === 0}
            className={`chat-mode-btn ${useWorkspaceContext ? 'chat-mode-btn--active' : ''}`}
            title={
              workspaceStats.selectedFiles === 0
                ? t('chat.workspaceEmpty')
                : t('chat.workspaceSelected', { count: workspaceStats.selectedFiles })
            }
          >
            <FolderOpen size={14} />
            <CheckSquare size={14} color={useWorkspaceContext ? 'var(--accent-color)' : 'var(--text-secondary)'} />
            <span>
              {t('chat.workspaceCtx')}
              {workspaceStats.selectedFiles > 0 ? ` (${workspaceStats.selectedFiles})` : ''}
            </span>
          </button>
        </div>
        {(indexStats.indexedFiles > 0 || indexBuildState.status === 'building' || indexBuildState.status === 'error') && (
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

      {subscriptionExpiredBanner && (
        <div className="chat-subscription-expired" role="status">
          {subscriptionExpiredBanner}
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message, index) => {
          const isAssistant = message.role === 'assistant'
          return (
            <div key={index} className={`chat-msg-row ${isAssistant ? '' : 'chat-msg-row--user'}`}>
              {isAssistant && (
                <div className="chat-msg-avatar chat-msg-avatar--assistant">
                  <Bot size={14} color="#c4b5fd" />
                </div>
              )}

              <div className={`chat-msg-bubble ${isAssistant ? 'chat-msg-bubble--assistant' : 'chat-msg-bubble--user'}`}>
                <ChatMessageBody content={message.content} variant={message.role} />
              </div>

              {!isAssistant && (
                <div className="chat-msg-avatar chat-msg-avatar--user">
                  <User size={14} color="#5ee9b5" />
                </div>
              )}
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
              <AgentToolPanel activity={agentActivity} defaultCollapsed={false} />
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
      </div>

      <div className="chat-input-area chat-input-area--stacked">
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
