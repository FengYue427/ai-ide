import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CheckSquare, Code2, FilePlus, FolderOpen, Send, Sparkles, User, Wand2, Zap } from 'lucide-react'
import { aiAgentService } from '../services/aiAgentService'
import {
  appendMcpToolsToPrompt,
  buildMcpToolsPromptSection,
  processAgentMcpTurn,
} from '../services/mcpAgentBridge'
import { loadMcpSettings } from '../services/mcpConfigService'
import { parseAgentFileChanges, type AgentFileChange } from '../services/agentApplyService'
import { getOldContentForPath } from '../services/fileApplyService'
import { extractCodeBlocks, generateCodePrompt, sendMessage, type AIConfig, type QuotaCheck } from '../services/aiService'
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
import { projectIndexManager } from '../services/projectIndexManager'
import type { IndexSearchHit } from '../services/projectIndexService'
import { canUseEmbeddings } from '../services/embeddingService'
import { buildSemanticContextSection } from '../services/semanticSearchService'
import { collectSearchableFiles } from '../services/searchService'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  aiConfig: AIConfig
  currentCode: string
  onGenerateFiles?: (files: { name: string; content: string; language: string }[]) => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({ aiConfig, currentCode, onGenerateFiles }) => {
  const { t } = useI18n()
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
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const [mounted, setMounted] = useState(false)
  const [useWorkspaceContext, setUseWorkspaceContext] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  const [workspaceStats, setWorkspaceStats] = useState(workspaceContextService.getStats())
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: createWelcomeMessage(aiConfig) }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAgentChanges, setPendingAgentChanges] = useState<AgentFileChange[] | null>(null)
  const [mentionHits, setMentionHits] = useState<IndexSearchHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [indexVersion, setIndexVersion] = useState(() => projectIndexManager.getVersion())
  const inputRef = useRef<HTMLTextAreaElement>(null)
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

  useEffect(() => projectIndexManager.subscribe(() => setIndexVersion(projectIndexManager.getVersion())), [])

  const refreshMentionHits = useCallback((text: string, cursor: number) => {
    const query = getActiveMentionQuery(text, cursor)
    if (query === null) {
      setMentionHits([])
      return
    }
    setMentionHits(projectIndexManager.search(query, 8))
    setMentionIndex(0)
  }, [indexVersion])

  const applyProjectRules = useCallback(
    (prompt: string) => appendProjectRules(prompt, projectRules),
    [projectRules],
  )

  const augmentWithSemanticContext = useCallback(
    async (basePrompt: string, query: string) => {
      if (!useWorkspaceContext || !canUseEmbeddings(aiConfig)) return basePrompt

      const workspaceFiles = workspaceContextService.getAllFiles().map((file) => ({
        path: file.path,
        content: file.content,
      }))
      const searchable = collectSearchableFiles(
        editorFiles.map((file) => ({ name: file.name, content: file.content })),
        workspaceFiles,
      ).map((file) => ({ path: file.name, content: file.content }))

      const section = await buildSemanticContextSection(query, searchable, aiConfig)
      return section ? `${basePrompt}${section}` : basePrompt
    },
    [aiConfig, editorFiles, useWorkspaceContext],
  )

  const refreshQuota = useCallback(() => {
    void fetchAIQuota(currentPlan, !!currentUser).then(setQuota)
  }, [currentPlan, currentUser])

  useEffect(() => {
    refreshQuota()
  }, [currentPlan, currentUser, refreshQuota])

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

  const handleSend = async (customInput?: string, action?: keyof typeof quickActionLabels) => {
    const textToSend = customInput || input
    if (!textToSend.trim()) return

    const currentQuota = await fetchAIQuota(currentPlan, !!currentUser)
    setQuota(currentQuota)

    if (!currentQuota.allowed) {
      appendError(
        t('chat.quotaExceeded', { used: currentQuota.used, limit: currentQuota.limit }),
      )
      return
    }

    if (!isConfigured) {
      appendError(t('chat.needConfig'))
      return
    }

    const userMessage: Message = { role: 'user', content: textToSend }
    setMessages((prev) => [...prev, userMessage])
    if (!customInput) setInput('')
    setLoading(true)

    try {
      const history = messages
        .slice(1)
        .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }))

      let aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[]

      if (agentMode) {
        const workspaceSummary =
          useWorkspaceContext && workspaceStats.selectedFiles > 0
            ? workspaceContextService.generateSystemPrompt(
                action ? t('chat.prompt.userRequest', { action: quickActionLabels[action] }) : '',
              )
            : t('chat.prompt.editorFile', { code: currentCode })

        const mcpSection = await buildMcpToolsPromptSection()
        let agentSystemPrompt = await augmentWithSemanticContext(
          applyProjectRules(workspaceSummary),
          textToSend,
        )
        const mentionSection = buildMentionContextSection(
          textToSend,
          editorFiles,
          projectIndexManager.getIndex(),
        )
        if (mentionSection) {
          agentSystemPrompt = `${agentSystemPrompt}\n\n${mentionSection}`
        }
        aiMessages = aiAgentService.buildMessages(
          textToSend,
          appendMcpToolsToPrompt(agentSystemPrompt, mcpSection),
          history,
        )
      } else {
        let systemPrompt: string

        if (useWorkspaceContext && workspaceStats.selectedFiles > 0) {
          const additionalContext = action
            ? t('chat.prompt.userRequest', { action: quickActionLabels[action] })
            : ''
          systemPrompt = workspaceContextService.generateSystemPrompt(additionalContext)
        } else {
          systemPrompt = action
            ? generateCodePrompt(action, currentCode)
            : t('chat.system.default', { code: currentCode })
        }

        systemPrompt = await augmentWithSemanticContext(applyProjectRules(systemPrompt), textToSend)
        const mentionSection = buildMentionContextSection(
          textToSend,
          editorFiles,
          projectIndexManager.getIndex(),
        )
        if (mentionSection) {
          systemPrompt = `${systemPrompt}\n\n${mentionSection}`
        }

        aiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...history,
          { role: 'user' as const, content: textToSend },
        ]
      }

      let assistantContent = ''

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
      })

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
            })
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
      appendError(
        t('chat.requestFailed', {
          message: error.message || t('chat.unknownError'),
        }),
      )
    } finally {
      setLoading(false)
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
    <div className={`chat-container chat-panel ${mounted ? 'chat-panel--mounted' : ''}`}>
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
            onClick={() => setAgentMode((value) => !value)}
            className={`chat-mode-btn ${agentMode ? 'chat-mode-btn--active' : ''}`}
            title={t('chat.agentModeTitle')}
          >
            <Zap size={14} color={agentMode ? 'var(--accent-color)' : 'var(--text-secondary)'} />
            <span>
              {t('chat.agent')}
              {agentMode ? ` ${t('chat.agentOn')}` : ''}
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
      </div>

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
                {message.content.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex}>{line || ' '}</div>
                ))}
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
            onClick={() => handleSend()}
            disabled={!isConfigured || loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

    </div>
  )
}

export default ChatPanel
