import React, { useState, useRef, useEffect } from 'react'
import { Wand2, X, Check, Loader2 } from 'lucide-react'
import { sendMessage } from '../services/aiService'
import type { AIModel } from '../services/aiService'

interface InlineAIEditProps {
  selectedText: string
  language: string
  onAccept: (newText: string) => void
  onReject: () => void
  onClose: () => void
  aiConfig: {
    provider: AIModel
    apiKey: string
    model?: string
    endpoint?: string
  }
}

const InlineAIEdit: React.FC<InlineAIEditProps> = ({
  selectedText,
  language,
  onAccept,
  onReject,
  onClose,
  aiConfig
}) => {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const quickActions = [
    { label: '解释', prompt: '解释这段代码' },
    { label: '重构', prompt: '重构这段代码，使其更清晰' },
    { label: '优化', prompt: '优化这段代码的性能' },
    { label: '修复', prompt: '检查并修复这段代码的问题' },
    { label: '添加注释', prompt: '为这段代码添加详细注释' },
    { label: '简化', prompt: '简化这段代码' },
  ]

  const handleSubmit = async (customPrompt?: string) => {
    const prompt = customPrompt || instruction
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)

    try {
      const systemPrompt = `你是一个代码编辑助手。用户选中了一段 ${language} 代码，并给出了修改指令。

请根据指令修改代码，并遵循以下规则：
1. 只输出修改后的代码，不要包含解释
2. 保持代码的缩进和格式
3. 如果是指令无法理解，输出 "ERROR: 无法处理该指令"

选中的代码：
\`\`\`
${selectedText}
\`\`\`

用户指令：${prompt}

输出修改后的代码：`

      let result = ''
      
      await sendMessage(
        aiConfig,
        [
          { role: 'system' as const, content: 'You are a code editing assistant. Output only code, no explanations.' },
          { role: 'user' as const, content: systemPrompt }
        ],
        (chunk: string) => {
          result += chunk
        }
      )

      // Clean up result
      result = result
        .replace(/^```[\w]*\n?/gm, '')
        .replace(/```$/gm, '')
        .trim()

      if (result.startsWith('ERROR:')) {
        setError(result)
      } else {
        setSuggestion(result)
      }
    } catch (err: any) {
      setError(err.message || '请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (suggestion) {
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          minWidth: '300px',
          maxWidth: '500px'
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          AI 建议的修改
        </div>
        <pre
          style={{
            fontSize: '12px',
            background: 'var(--bg-secondary)',
            padding: '8px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflow: 'auto',
            marginBottom: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {suggestion}
        </pre>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setSuggestion(null)
              setInstruction('')
            }}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <X size={12} style={{ marginRight: '4px' }} />
            重新输入
          </button>
          <button
            onClick={onReject}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <X size={12} style={{ marginRight: '4px' }} />
            拒绝
          </button>
          <button
            onClick={() => onAccept(suggestion)}
            className="btn btn-primary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <Check size={12} style={{ marginRight: '4px' }} />
            接受
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1000,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        minWidth: '320px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Wand2 size={14} style={{ color: 'var(--accent-color)' }} />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>AI 内联编辑</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {selectedText.length} 字符已选中
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              setInstruction(action.prompt)
              handleSubmit(action.prompt)
            }}
            disabled={loading}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入指令，如：简化这段代码"
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 36px 8px 12px',
            fontSize: '13px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            boxSizing: 'border-box'
          }}
        />
        {loading ? (
          <Loader2
            size={16}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              animation: 'spin 1s linear infinite'
            }}
          />
        ) : (
          <button
            onClick={() => handleSubmit()}
            disabled={!instruction.trim()}
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '4px 8px',
              background: instruction.trim() ? 'var(--accent-color)' : 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: instruction.trim() ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
          >
            生成
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#f85149' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        按 Enter 生成，Esc 关闭
      </div>
    </div>
  )
}

export default InlineAIEdit
