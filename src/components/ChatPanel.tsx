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
import { formatQuotaLabel, quotaBarColor, quotaBarPercent } from '../lib/quotaDisplay'
import { getActiveMentionQuery, insertMention } from '../lib/mentionQuery'
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

const createWelcomeMessage = (aiConfig: AIConfig) =>
  `你好，我是你的 AI 编程助手。当前正在使用 ${aiConfig.provider}${aiConfig.model ? ` (${aiConfig.model})` : ''}。

我可以帮你：
- 解释当前代码
- 重构和优化实现
- 生成新功能骨架
- 帮你定位和修复问题

直接输入你的需求，或者先点下面的快捷动作开始。`

const quickActionLabels = {
  explain: '解释',
  refactor: '重构',
  fix: '优化',
  generate: '生成',
} as const

const ChatPanel: React.FC<ChatPanelProps> = ({ aiConfig, currentCode, onGenerateFiles }) => {
  const currentPlan = useIDEStore((s) => s.currentPlan)
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
          content: '请先配置 AI API Key，或者切换到本地 Ollama，再开始对话。',
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
  }, [aiConfig, isConfigured])

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
      appendError(`今天的 AI 请求额度已用完（${currentQuota.used}/${currentQuota.limit}）。

免费用户按天限额使用。稍后再试，或者升级套餐以获得更高额度。`)
      return
    }

    if (!isConfigured) {
      appendError('请先完成 AI 配置，再开始发消息。')
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
                action ? `用户请求：${quickActionLabels[action]}` : '',
              )
            : `当前编辑器文件:\n\`\`\`\n${currentCode}\n\`\`\``

        const mcpSection = await buildMcpToolsPromptSection()
        const agentSystemPrompt = await augmentWithSemanticContext(
          applyProjectRules(workspaceSummary),
          textToSend,
        )
        aiMessages = aiAgentService.buildMessages(
          textToSend,
          appendMcpToolsToPrompt(agentSystemPrompt, mcpSection),
          history,
        )
      } else {
        let systemPrompt: string

        if (useWorkspaceContext && workspaceStats.selectedFiles > 0) {
          const additionalContext = action ? `用户请求：${quickActionLabels[action]}` : ''
          systemPrompt = workspaceContextService.generateSystemPrompt(additionalContext)
        } else {
          systemPrompt = action
            ? generateCodePrompt(action, currentCode)
            : `你是一名专业的编程助手。当前代码如下：

\`\`\`
${currentCode}
\`\`\`

请根据用户的问题给出清晰可执行的帮助。如果需要返回代码，请尽量标注文件名，并输出完整代码块。`
        }

        systemPrompt = await augmentWithSemanticContext(applyProjectRules(systemPrompt), textToSend)

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
                content: `MCP 工具已执行，结果如下。请继续完成任务；若还需调用工具，可再输出 <<<mcp-tool>>> 块。\n\n${toolLog.join('\n')}`,
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
          assistantContent = `${assistantContent}\n\n**MCP 工具结果**\n${mcpTurn.toolLog.join('\n')}`
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
      appendError(`请求失败：${error.message || '未知错误'}

你可以检查：
- API Key 是否正确
- 网络是否正常
- 如果使用 Ollama，本地服务是否已启动`)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = useMemo(
    () => [
      { icon: Code2, label: '解释', action: () => handleSend('请解释这段代码。', 'explain') },
      { icon: Wand2, label: '重构', action: () => handleSend('请重构这段代码。', 'refactor') },
      { icon: Sparkles, label: '优化', action: () => handleSend('请优化这段代码的实现和性能。', 'fix') },
      { icon: FilePlus, label: '生成', action: () => handleSend('基于当前代码，生成一个相关的新功能。', 'generate') },
    ],
    [currentCode, messages, useWorkspaceContext, workspaceStats.selectedFiles],
  )

  const pickMention = (hit: IndexSearchHit) => {
    const label = hit.type === 'symbol' ? `${hit.name}` : hit.path
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
      className="chat-container"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(124,156,255,0.12), transparent 26%), linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 96%, transparent), color-mix(in srgb, var(--bg-primary) 94%, transparent))',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(10px)',
        transition: 'all 0.35s ease-out',
      }}
    >
      <div
        style={{
          padding: '14px',
          borderBottom: '1px solid var(--border-color)',
          display: 'grid',
          gap: '10px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
        }}
      >
        <div
          style={{
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bot size={16} color="var(--accent-color)" />
            <strong style={{ fontSize: '13px' }}>当前 AI 会话</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 8px', borderRadius: '999px', background: 'var(--bg-tertiary)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {aiConfig.provider}
            </span>
            <span style={{ padding: '5px 8px', borderRadius: '999px', background: 'var(--bg-tertiary)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {aiConfig.model || '未指定模型'}
            </span>
            <span
              style={{
                padding: '5px 8px',
                borderRadius: '999px',
                background: isConfigured ? 'color-mix(in srgb, var(--success-color) 16%, transparent)' : 'color-mix(in srgb, var(--warning-color) 16%, transparent)',
                fontSize: '11px',
                color: isConfigured ? 'var(--success-color)' : 'var(--warning-color)',
              }}
            >
              {isConfigured ? '已配置' : '待配置'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>今日用量</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${quotaBarPercent(quota.used, quota.limit)}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: quotaBarColor(quota.used, quota.limit),
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatQuotaLabel(quota.used, quota.limit)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAgentMode((value) => !value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 14px',
              borderRadius: '14px',
              border: `1px solid ${agentMode ? 'color-mix(in srgb, var(--accent-color) 34%, var(--border-color))' : 'var(--border-color)'}`,
              background: agentMode ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title="Agent 模式：自动解析多文件改动并写入编辑器"
          >
            <Zap size={14} color={agentMode ? 'var(--accent-color)' : 'var(--text-secondary)'} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Agent{agentMode ? ' 开' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setUseWorkspaceContext((value) => !value)}
            disabled={workspaceStats.selectedFiles === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 14px',
              borderRadius: '14px',
              border: `1px solid ${useWorkspaceContext ? 'color-mix(in srgb, var(--accent-color) 34%, var(--border-color))' : 'var(--border-color)'}`,
              background: useWorkspaceContext ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'var(--bg-primary)',
              color: workspaceStats.selectedFiles === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
              cursor: workspaceStats.selectedFiles === 0 ? 'not-allowed' : 'pointer',
              opacity: workspaceStats.selectedFiles === 0 ? 0.65 : 1,
            }}
            title={workspaceStats.selectedFiles === 0 ? '先在工作区中导入文件，才能启用完整上下文。' : `已选择 ${workspaceStats.selectedFiles} 个工作区文件`}
          >
            <FolderOpen size={14} />
            <CheckSquare size={14} color={useWorkspaceContext ? 'var(--accent-color)' : 'var(--text-secondary)'} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>工作区上下文{workspaceStats.selectedFiles > 0 ? ` (${workspaceStats.selectedFiles})` : ''}</span>
          </button>
        </div>
      </div>

      <div
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((message, index) => {
          const isAssistant = message.role === 'assistant'
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              {isAssistant && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(124,156,255,0.22), rgba(168,85,247,0.18))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={14} color="#c4b5fd" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '92%',
                  padding: '10px 12px',
                  borderRadius: isAssistant ? '16px 16px 16px 8px' : '16px 16px 8px 16px',
                  background: isAssistant
                    ? 'linear-gradient(135deg, rgba(124,156,255,0.14), rgba(168,85,247,0.08))'
                    : 'linear-gradient(135deg, rgba(51,197,142,0.18), rgba(51,197,142,0.08))',
                  border: `1px solid ${isAssistant ? 'rgba(124,156,255,0.20)' : 'rgba(51,197,142,0.22)'}`,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
                }}
              >
                {message.content.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex} style={{ lineHeight: 1.55, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {line || ' '}
                  </div>
                ))}
              </div>

              {!isAssistant && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(51,197,142,0.22), rgba(51,197,142,0.12))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <User size={14} color="#5ee9b5" />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(124,156,255,0.22), rgba(168,85,247,0.18))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Bot size={14} color="#c4b5fd" />
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px 16px 16px 8px',
                background: 'linear-gradient(135deg, rgba(124,156,255,0.14), rgba(168,85,247,0.08))',
                border: '1px solid rgba(124,156,255,0.20)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>思考中</span>
                <span className="typing-dots" style={{ display: 'inline-flex', gap: '4px' }}>
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
        <div
          style={{
            margin: '0 12px 8px',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid color-mix(in srgb, var(--accent-color) 35%, var(--border-color))',
            background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Agent 建议修改 {pendingAgentChanges.length} 个文件：
            {pendingAgentChanges.map((c) => c.path).join('、')}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPendingAgentChanges(null)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              忽略
            </button>
            <button
              type="button"
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
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              预览变更
            </button>
            <button
              type="button"
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
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-color)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              直接应用
            </button>
          </div>
        </div>
      ) : null}

      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.08))',
        }}
      >
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.action}
            disabled={loading || !isConfigured}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              cursor: loading || !isConfigured ? 'not-allowed' : 'pointer',
              opacity: loading || !isConfigured ? 0.6 : 1,
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <action.icon size={14} />
            {action.label}
          </button>
        ))}
      </div>

      <div
        className="chat-input-area"
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderTop: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.12))',
        }}
      >
        {mentionHits.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              maxHeight: '160px',
              overflow: 'auto',
            }}
          >
            {mentionHits.map((hit, index) => (
              <button
                key={`${hit.type}-${hit.path}-${hit.name}-${hit.line ?? 0}`}
                type="button"
                onClick={() => pickMention(hit)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    index === mentionIndex
                      ? 'color-mix(in srgb, var(--accent-color) 16%, transparent)'
                      : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={
              isConfigured ? '输入消息；@ 提及符号/文件；Enter 发送' : '请先配置 API Key 或本地 Ollama'
            }
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isConfigured || loading}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              lineHeight: 1.5,
              minHeight: '44px',
              maxHeight: '120px',
              outline: 'none',
              opacity: !isConfigured || loading ? 0.7 : 1,
            }}
          />
          <button
            className="chat-send"
            onClick={() => handleSend()}
            disabled={!isConfigured || loading || !input.trim()}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: !isConfigured || loading || !input.trim() ? 'var(--bg-tertiary)' : 'var(--accent-color)',
              border: '1px solid transparent',
              color: !isConfigured || loading || !input.trim() ? 'var(--text-secondary)' : '#fff',
              cursor: !isConfigured || loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: !isConfigured || loading || !input.trim() ? 0.6 : 1,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .typing-dots .dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: rgba(199, 210, 254, 0.9);
          display: inline-block;
          animation: typingDot 1.1s infinite ease-in-out;
        }

        .typing-dots .dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots .dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes typingDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default ChatPanel
