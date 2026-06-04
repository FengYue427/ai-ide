import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Wand2, X, Check, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { Z } from '../lib/layers'
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
  const { t } = useI18n()
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const quickActions = useMemo(
    () => [
      { label: t('inlineAi.quick.explain'), prompt: t('inlineAi.prompt.explain') },
      { label: t('inlineAi.quick.refactor'), prompt: t('inlineAi.prompt.refactor') },
      { label: t('inlineAi.quick.optimize'), prompt: t('inlineAi.prompt.optimize') },
      { label: t('inlineAi.quick.fix'), prompt: t('inlineAi.prompt.fix') },
      { label: t('inlineAi.quick.comment'), prompt: t('inlineAi.prompt.comment') },
      { label: t('inlineAi.quick.simplify'), prompt: t('inlineAi.prompt.simplify') },
    ],
    [t],
  )

  const handleSubmit = async (customPrompt?: string) => {
    const prompt = customPrompt || instruction
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)

    try {
      const systemPrompt = `${t('prompt.inline.system', { language })}\n\n${t('prompt.inline.rule1')}\n${t('prompt.inline.rule2')}\n${t('prompt.inline.rule3')}\n\n${t('prompt.inline.selected')}\n\`\`\`\n${selectedText}\n\`\`\`\n\n${t('prompt.inline.instruction', { prompt })}\n\n${t('prompt.inline.output')}`

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
      setError(err.message || t('inlineAi.requestFailed'))
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
          zIndex: Z.dropdown,
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
          {t('inlineAi.suggestion')}
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
            {t('inlineAi.retype')}
          </button>
          <button
            onClick={onReject}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <X size={12} style={{ marginRight: '4px' }} />
            {t('inlineAi.reject')}
          </button>
          <button
            onClick={() => onAccept(suggestion)}
            className="btn btn-primary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <Check size={12} style={{ marginRight: '4px' }} />
            {t('inlineAi.accept')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: Z.dropdown,
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
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('inlineAi.title')}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {t('inlineAi.charsSelected', { count: selectedText.length })}
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
          placeholder={t('inlineAi.placeholder')}
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
            {t('inlineAi.generate')}
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#f85149' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {t('inlineAi.hint')}
      </div>
    </div>
  )
}

export default InlineAIEdit
