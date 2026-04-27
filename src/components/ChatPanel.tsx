import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Sparkles, Code2, Wand2, FilePlus, FolderOpen, CheckSquare } from 'lucide-react'
import { sendMessage, extractCodeBlocks, generateCodePrompt, type AIConfig } from '../services/aiService'
import { workspaceContextService } from '../services/workspaceContextService'

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
  const [mounted, setMounted] = useState(false)
  const [useWorkspaceContext, setUseWorkspaceContext] = useState(false)
  const [workspaceStats, setWorkspaceStats] = useState(workspaceContextService.getStats())
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `你好！我是你的 AI 编程助手。当前使用: ${aiConfig.provider}${aiConfig.model ? ` (${aiConfig.model})` : ''}

我可以帮你:
• 解释代码
• 重构优化
• 生成新功能
• 修复 Bug

直接输入问题，或使用快捷操作。

💡 点击上方的"工作区"按钮上传整个项目，让AI理解完整上下文！` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isConfigured = !!aiConfig.apiKey || aiConfig.provider === 'ollama'

  // 刷新工作区统计
  const refreshWorkspaceStats = useCallback(() => {
    setWorkspaceStats(workspaceContextService.getStats())
  }, [])

  useEffect(() => {
    // 监听工作区变化
    const interval = setInterval(refreshWorkspaceStats, 1000)
    return () => clearInterval(interval)
  }, [refreshWorkspaceStats])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!aiConfig.apiKey && aiConfig.provider !== 'ollama') {
      setMessages([{
        role: 'assistant',
        content: '⚠️ 请先配置 AI API Key\n\n点击顶部工具栏的 "AI" 按钮进行配置。'
      }])
    }
  }, [aiConfig])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (customInput?: string, action?: 'explain' | 'refactor' | 'fix' | 'generate') => {
    const textToSend = customInput || input
    if (!textToSend.trim()) return

    // 检查 API 配置
    if (!aiConfig.apiKey && aiConfig.provider !== 'ollama') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '请先配置 API Key。点击顶部 "AI" 按钮进行设置。'
      }])
      return
    }

    const userMessage: Message = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMessage])
    if (!customInput) setInput('')
    setLoading(true)

    try {
      // 根据是否使用工作区上下文生成不同的系统提示
      let systemPrompt: string
      
      if (useWorkspaceContext && workspaceStats.selectedFiles > 0) {
        // 使用工作区上下文 - AI理解整个项目
        const additionalContext = action 
          ? `用户请求: ${action === 'explain' ? '解释代码' : action === 'refactor' ? '重构代码' : action === 'fix' ? '修复Bug' : '生成新功能'}`
          : ''
        systemPrompt = workspaceContextService.generateSystemPrompt(additionalContext)
      } else {
        // 只使用当前文件
        systemPrompt = action 
          ? generateCodePrompt(action, currentCode)
          : `你是一个专业的编程助手。当前用户正在编辑的代码是：

\`\`\`
${currentCode}
\`\`\`

请根据用户的提问提供帮助。如果需要修改代码，请用 \`\`\`filename.ext 的格式标注文件名，输出完整的代码块。`
      }

      const aiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(1).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: textToSend }
      ]

      let assistantContent = ''
      
      await sendMessage(
        aiConfig,
        aiMessages,
        (chunk) => {
          assistantContent += chunk
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMsg = newMessages[newMessages.length - 1]
            if (lastMsg.role === 'assistant') {
              lastMsg.content = assistantContent
            } else {
              newMessages.push({ role: 'assistant', content: assistantContent })
            }
            return newMessages
          })
        }
      )

      // 检查是否有代码块可以生成文件
      if (onGenerateFiles) {
        const codeBlocks = extractCodeBlocks(assistantContent)
        
        // 改进的文件名识别：尝试从代码块前的文本中提取文件名
        const files: { name: string; content: string; language: string }[] = []
        
        codeBlocks.forEach((block, idx) => {
          if (!block.language || block.language === 'text') return
          
          // 尝试从assistantContent中找到这个代码块前面的文件名
          // 查找模式: ### filename.ext 或 `filename.ext` 或 文件名: xxx.ext
          const blockStart = assistantContent.indexOf('```' + block.language)
          const contentBefore = assistantContent.substring(0, blockStart)
          const linesBefore = contentBefore.split('\n').slice(-5) // 获取代码块前5行
          
          let filename: string | null = null
          
          // 尝试匹配各种文件名模式
          const patterns = [
            /###\s+([\w\-./]+\.[\w]+)/,  // ### filename.ext
            /`([\w\-./]+\.[\w]+)`/,       // `filename.ext`
            /文件名[:\s]+([\w\-./]+\.[\w]+)/i,  // 文件名: xxx.ext
            /文件[:\s]+([\w\-./]+\.[\w]+)/i,    // 文件: xxx.ext
            /([\w\-./]+\.(?:js|ts|jsx|tsx|py|html|css|scss|json|md|vue|java|go|rs|php|rb|swift|kt|sql))/i
          ]
          
          for (const line of linesBefore.reverse()) { // 从近到远搜索
            for (const pattern of patterns) {
              const match = line.match(pattern)
              if (match) {
                filename = match[1]
                break
              }
            }
            if (filename) break
          }
          
          // 如果没找到文件名，使用默认命名
          if (!filename) {
            filename = `generated-${idx + 1}.${block.language === 'typescript' ? 'ts' : block.language === 'javascript' ? 'js' : block.language}`
          }
          
          files.push({
            name: filename,
            content: block.code,
            language: block.language
          })
        })
        
        if (files.length > 0) {
          onGenerateFiles(files)
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ 请求失败: ${error.message || '未知错误'}\n\n请检查:\n• API Key 是否正确\n• 网络连接是否正常\n• 对于 Ollama，请确保本地服务已启动 (ollama serve)`
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { icon: Code2, label: '解释', action: () => handleSend('请解释这段代码', 'explain') },
    { icon: Wand2, label: '重构', action: () => handleSend('请重构这段代码', 'refactor') },
    { icon: Sparkles, label: '优化', action: () => handleSend('请优化这段代码的性能', 'fix') },
    { icon: FilePlus, label: '生成', action: () => handleSend('基于当前代码，生成一个相关的新功能', 'generate') }
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="chat-container"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(102, 126, 234, 0.14) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.12) 0%, transparent 55%),
          linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%),
          var(--bg-secondary)
        `,
        borderLeft: '1px solid var(--border-color)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(10px)',
        transition: 'all 0.35s ease-out',
      }}
    >
      <div
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant'
          const bubbleBg = isAssistant
            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(59, 130, 246, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.08) 100%)'
          const bubbleBorder = isAssistant ? 'rgba(168, 85, 247, 0.28)' : 'rgba(16, 185, 129, 0.28)'

          return (
            <div
              key={idx}
              className="chat-message"
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                justifyContent: isAssistant ? 'flex-start' : 'flex-end',
              }}
            >
              {isAssistant && (
                <div
                  className={`chat-avatar ${msg.role}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(59, 130, 246, 0.16) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    flex: '0 0 auto',
                  }}
                >
                  <Bot size={14} style={{ color: '#c4b5fd' }} />
                </div>
              )}

              <div
                className="chat-content"
                style={{
                  maxWidth: '92%',
                  padding: '10px 12px',
                  borderRadius: isAssistant ? '14px 14px 14px 8px' : '14px 14px 8px 14px',
                  background: bubbleBg,
                  border: `1px solid ${bubbleBorder}`,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {msg.content.split('\n').map((line, i) => (
                  <div key={i} style={{ lineHeight: 1.45, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {line || ' '}
                  </div>
                ))}
              </div>

              {!isAssistant && (
                <div
                  className={`chat-avatar ${msg.role}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.20) 0%, rgba(16, 185, 129, 0.10) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    flex: '0 0 auto',
                  }}
                >
                  <User size={14} style={{ color: '#34d399' }} />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="chat-message" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div
              className="chat-avatar assistant"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(59, 130, 246, 0.16) 100%)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              }}
            >
              <Bot size={14} style={{ color: '#c4b5fd' }} />
            </div>
            <div
              className="chat-content"
              style={{
                padding: '10px 12px',
                borderRadius: '14px 14px 14px 8px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
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

      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 100%)',
        }}
      >
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.action}
            disabled={loading || !isConfigured}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              cursor: loading || !isConfigured ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
              opacity: loading || !isConfigured ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (loading || !isConfigured) return
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <action.icon size={14} />
            {action.label}
          </button>
        ))}
        
        {/* 工作区上下文切换 */}
        <button
          onClick={() => setUseWorkspaceContext(!useWorkspaceContext)}
          disabled={workspaceStats.selectedFiles === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 10px',
            fontSize: '12px',
            background: useWorkspaceContext 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: `1px solid ${useWorkspaceContext ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255,255,255,0.10)'}`,
            borderRadius: '10px',
            color: useWorkspaceContext ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: workspaceStats.selectedFiles === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
            opacity: workspaceStats.selectedFiles === 0 ? 0.5 : 1,
          }}
          title={workspaceStats.selectedFiles === 0 ? '请先在工作区中上传文件' : `使用工作区上下文 (${workspaceStats.selectedFiles} 个文件)`}
        >
          <FolderOpen size={14} />
          <CheckSquare size={14} style={{ opacity: useWorkspaceContext ? 1 : 0.3 }} />
          工作区
          {workspaceStats.selectedFiles > 0 && (
            <span style={{ fontSize: '10px', opacity: 0.8 }}>({workspaceStats.selectedFiles})</span>
          )}
        </button>
      </div>

      <div
        className="chat-input-area"
        style={{
          padding: '12px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          borderTop: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.18) 100%)',
        }}
      >
        <textarea
          className="chat-input"
          placeholder={isConfigured ? '输入消息...（Enter 发送，Shift+Enter 换行）' : '请先配置 API Key'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConfigured || loading}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: 1.45,
            minHeight: '40px',
            maxHeight: '120px',
            outline: 'none',
            boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
            opacity: !isConfigured || loading ? 0.7 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
          }}
        />
        <button
          className="chat-send"
          onClick={() => handleSend()}
          disabled={!isConfigured || loading || !input.trim()}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: !isConfigured || loading || !input.trim()
              ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(168, 85, 247, 0.55) 0%, rgba(59, 130, 246, 0.55) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'var(--text-primary)',
            cursor: !isConfigured || loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
            opacity: !isConfigured || loading || !input.trim() ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isConfigured || loading || !input.trim()) return
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Send size={16} />
        </button>
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
