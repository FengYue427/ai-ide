export type AIModel = 'openai' | 'deepseek' | 'claude' | 'google' | 'ollama' | 'qwen' | 'zhipu' | 'minimax' | 'grok'

export interface AIConfig {
  provider: AIModel
  apiKey: string
  endpoint?: string  // 用于自定义 API 端点
  model?: string     // 具体模型名称
}

// ==================== 用量限制管理 ====================

import { createTranslator, type Language, type TranslationKey } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'
import { checkAIQuotaLocal } from './usageService'

export interface QuotaCheck {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  plan: string
}

/** @deprecated Prefer usageService.fetchAIQuota for logged-in users */
export function checkAIQuota(currentPlan: string = 'free'): QuotaCheck {
  return checkAIQuotaLocal(currentPlan)
}

/** Check quota and reserve one unit before the upstream AI call (prevents parallel overuse). */
async function reserveQuotaBeforeRequest(skipQuotaCheck?: boolean): Promise<void> {
  if (skipQuotaCheck) return
  const { ensureAIQuotaFromStore, recordAIUsageEvent } = await import('./usageService')
  const { useIDEStore } = await import('../store/ideStore')
  await ensureAIQuotaFromStore()
  const state = useIDEStore.getState()
  await recordAIUsageEvent(!!state.currentUser, state.currentPlan)
}

// ==================== 模型配置 ====================

export type ModelOptionMeta = { models: string[]; needsKey: boolean }

export const modelOptions: Record<AIModel, ModelOptionMeta> = {
  openai: {
    models: ['gpt-5.4', 'gpt-5.4-thinking', 'gpt-5.4-pro', 'gpt-5', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    needsKey: true,
  },
  deepseek: {
    models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-r1', 'deepseek-chat', 'deepseek-coder'],
    needsKey: true,
  },
  claude: {
    models: ['claude-opus-4.7', 'claude-opus-4.6', 'claude-sonnet-4.6', 'claude-sonnet-4.5', 'claude-haiku-4'],
    needsKey: true,
  },
  google: {
    models: ['gemini-3.1-pro', 'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    needsKey: true,
  },
  qwen: {
    models: ['qwen-3.5-max', 'qwen-3.5-plus', 'qwen-3.5-9b', 'qwen-3.5-4b', 'qwen-3.5-2b'],
    needsKey: true,
  },
  zhipu: {
    models: ['glm-5', 'glm-5.1', 'glm-4-plus', 'glm-4-flash'],
    needsKey: true,
  },
  minimax: {
    models: ['minimax-m2.5', 'minimax-m2.5-lightning'],
    needsKey: true,
  },
  grok: {
    models: ['grok-4.20', 'grok-4.20-reasoning'],
    needsKey: true,
  },
  ollama: {
    models: ['llama4-maverick', 'llama4-scout', 'qwen2.5', 'glm4', 'codellama', 'mistral'],
    needsKey: false,
  },
}

export function modelProviderTranslationKey(
  provider: AIModel,
  field: 'name' | 'desc',
): TranslationKey {
  return `ai.provider.${provider}.${field}` as TranslationKey
}

function aiServiceError(
  key: TranslationKey,
  params?: Record<string, string | number>,
): Error {
  return new Error(createTranslator(getApiLanguage())(key, params))
}

export const defaultEndpoints: Record<AIModel, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  qwen: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  minimax: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  grok: 'https://api.x.ai/v1/chat/completions',
  ollama: 'http://localhost:11434/api/generate'
}

export async function sendMessage(
  config: AIConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onStream?: (chunk: string) => void,
  options?: { skipQuotaCheck?: boolean; signal?: AbortSignal },
): Promise<string> {
  await reserveQuotaBeforeRequest(options?.skipQuotaCheck)

  const endpoint = config.endpoint || defaultEndpoints[config.provider]
  const model = config.model || modelOptions[config.provider].models[0]

  let result: string
  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'qwen':
    case 'zhipu':
    case 'minimax':
    case 'grok':
      result = await sendOpenAICompatible(endpoint, config.apiKey, model, messages, onStream, options?.signal)
      break
    case 'google':
      result = await sendGoogleGemini(endpoint, config.apiKey, model, messages, onStream, options?.signal)
      break
    case 'claude':
      result = await sendClaude(endpoint, config.apiKey, model, messages, onStream, options?.signal)
      break
    case 'ollama':
      result = await sendOllama(endpoint, model, messages, onStream, options?.signal)
      break
    default:
      throw aiServiceError('ai.error.unsupportedProvider', { provider: config.provider })
  }

  return result
}

// ==================== 防抖与限流 ====================

interface PendingRequest {
  promise: Promise<string>
  timestamp: number
  abortController: AbortController
}

const pendingRequests = new Map<string, PendingRequest>()
const requestHistory: number[] = [] // 记录请求时间戳用于限流

const DEBOUNCE_MS = 300 // 防抖时间
const RATE_LIMIT_WINDOW_MS = 60000 // 限流窗口：1分钟
const RATE_LIMIT_MAX_REQUESTS = 20 // 每分钟最大请求数

/**
 * 生成请求唯一标识（基于配置和消息内容）
 */
function generateRequestKey(config: AIConfig, messages: unknown[]): string {
  const messageHash = JSON.stringify(messages).slice(0, 200) // 限制长度
  return `${config.provider}:${config.model}:${messageHash}`
}

/**
 * 检查是否触发限流
 */
function checkRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  
  // 清理过期记录
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  while (requestHistory.length > 0 && requestHistory[0] < cutoff) {
    requestHistory.shift()
  }
  
  if (requestHistory.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((requestHistory[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  return { allowed: true }
}

/**
 * 带防抖和限流的 AI 请求函数
 */
export async function sendMessageWithDebounce(
  config: AIConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onStream?: (chunk: string) => void,
  options?: {
    debounceMs?: number
    skipDebounce?: boolean
    skipQuotaCheck?: boolean
  }
): Promise<string> {
  await reserveQuotaBeforeRequest(options?.skipQuotaCheck)

  const requestKey = generateRequestKey(config, messages)
  const debounceMs = options?.debounceMs || DEBOUNCE_MS
  
  // 检查限流
  const rateLimit = checkRateLimit()
  if (!rateLimit.allowed) {
    throw aiServiceError('ai.error.rateLimit', { seconds: rateLimit.retryAfter ?? 60 })
  }
  
  // 取消之前的相同请求（防抖）
  const existing = pendingRequests.get(requestKey)
  if (existing && !options?.skipDebounce) {
    const elapsed = Date.now() - existing.timestamp
    if (elapsed < debounceMs) {
      existing.abortController.abort()
      pendingRequests.delete(requestKey)
    }
  }
  
  // 创建新的 AbortController
  const abortController = new AbortController()
  
  // 创建新请求
  const promise = sendMessageInternal(config, messages, onStream, abortController)
    .finally(() => {
      // 请求完成后清理
      setTimeout(() => {
        if (pendingRequests.get(requestKey)?.promise === promise) {
          pendingRequests.delete(requestKey)
        }
      }, debounceMs)
    })
  
  // 记录请求
  pendingRequests.set(requestKey, {
    promise,
    timestamp: Date.now(),
    abortController
  })
  
  // 记录到限流历史
  requestHistory.push(Date.now())

  return promise
}

/**
 * 内部发送函数（支持中断）
 */
async function sendMessageInternal(
  config: AIConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onStream?: (chunk: string) => void,
  abortController?: AbortController
): Promise<string> {
  const endpoint = config.endpoint || defaultEndpoints[config.provider]
  const model = config.model || modelOptions[config.provider].models[0]
  
  if (abortController?.signal.aborted) {
    throw aiServiceError('ai.error.aborted')
  }
  
  // 包装 onStream 以检查中断信号
  const wrappedOnStream = onStream
    ? (chunk: string) => {
        if (abortController?.signal.aborted) return
        onStream(chunk)
      }
    : undefined
  
  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'qwen':
    case 'zhipu':
    case 'minimax':
    case 'grok':
      return sendOpenAICompatible(endpoint, config.apiKey, model, messages, wrappedOnStream, abortController?.signal)
    case 'google':
      return sendGoogleGemini(endpoint, config.apiKey, model, messages, wrappedOnStream, abortController?.signal)
    case 'claude':
      return sendClaude(endpoint, config.apiKey, model, messages, wrappedOnStream, abortController?.signal)
    case 'ollama':
      return sendOllama(endpoint, model, messages, wrappedOnStream, abortController?.signal)
    default:
      throw aiServiceError('ai.error.unsupportedProvider', { provider: config.provider })
  }
}

export function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: { language: string; code: string }[] = []
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return blocks
}

// 生成代码相关的系统提示（跟随 UI 语言）
export function generateCodePrompt(
  action: 'explain' | 'refactor' | 'generate' | 'fix',
  context: string,
  locale: Language = 'zh-CN',
): string {
  const t = createTranslator(locale)
  const basePrompt = t('prompt.code.base', { context })
  const prompts: Record<string, string> = {
    explain: basePrompt + t('prompt.code.explain'),
    refactor: basePrompt + t('prompt.code.refactor'),
    generate: basePrompt + t('prompt.code.generate'),
    fix: basePrompt + t('prompt.code.fix'),
  }
  return prompts[action]
}

// ==================== 带中断信号的发送函数 ====================

async function sendOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: !!onStream
    }),
    signal
  })
  
  if (!response.ok) {
    throw aiServiceError('ai.error.httpStatus', { status: response.status })
  }
  
  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    
    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel()
          throw aiServiceError('ai.error.aborted')
        }
        
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          if (line === 'data: [DONE]') continue
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content || ''
              fullContent += content
              onStream(content)
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        throw aiServiceError('ai.error.aborted')
      }
      throw err
    }
    return fullContent
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

async function sendClaude(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      stream: !!onStream
    }),
    signal
  })
  
  if (!response.ok) {
    throw aiServiceError('ai.error.claudeStatus', { status: response.status })
  }
  
  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    
    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel()
          throw aiServiceError('ai.error.aborted')
        }
        
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content_block_delta') {
                const content = data.delta?.text || ''
                fullContent += content
                onStream(content)
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        throw aiServiceError('ai.error.aborted')
      }
      throw err
    }
    return fullContent
  }
  
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

async function sendGoogleGemini(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  _onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${endpoint}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    }),
    signal
  })
  
  if (!response.ok) {
    throw aiServiceError('ai.error.geminiStatus', { status: response.status })
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw aiServiceError('ai.error.geminiMessage', { message: data.error.message })
  }
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function sendOllama(
  endpoint: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: !!onStream
    }),
    signal
  })
  
  if (!response.ok) {
    throw aiServiceError('ai.error.ollamaNotRunning')
  }
  
  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    
    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel()
          throw aiServiceError('ai.error.aborted')
        }
        
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            const content = data.response || ''
            fullContent += content
            onStream(content)
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        throw aiServiceError('ai.error.aborted')
      }
      throw err
    }
    return fullContent
  }
  
  const data = await response.json()
  return data.response
}
