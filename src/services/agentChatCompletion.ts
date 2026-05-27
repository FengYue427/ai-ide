import {
  defaultEndpoints,
  modelOptions,
  type AIConfig,
  type AIModel,
} from './aiService'
import { createTranslator, type TranslationKey } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'
import type { ChatCompletionResult, ChatMessage } from './agentChatTypes'
import type { OpenAIToolDefinition } from './agentTools/types'

const TOOL_PROVIDERS: AIModel[] = ['openai', 'deepseek', 'grok', 'zhipu', 'minimax']

/** DeepSeek V4 tool loop: disable thinking to avoid 400 without reasoning_content round-trip */
const DEEPSEEK_AGENT_THINKING = { type: 'disabled' as const }

export function supportsAgentToolCalling(provider: AIModel): boolean {
  if (import.meta.env.VITE_AGENT_TOOLS === '0') return false
  return TOOL_PROVIDERS.includes(provider)
}

function aiServiceError(key: TranslationKey, params?: Record<string, string | number>): Error {
  return new Error(createTranslator(getApiLanguage())(key, params))
}

async function reserveQuotaBeforeRequest(skipQuotaCheck?: boolean): Promise<void> {
  if (skipQuotaCheck) return
  const { ensureAIQuotaFromStore, recordAIUsageEvent } = await import('./usageService')
  const { useIDEStore } = await import('../store/ideStore')
  await ensureAIQuotaFromStore()
  const state = useIDEStore.getState()
  await recordAIUsageEvent(!!state.currentUser, state.currentPlan)
}

/** Map UI model ids to DeepSeek API ids (V4 chat completions). */
export function resolveAgentModelId(config: AIConfig): string {
  const model = config.model || modelOptions[config.provider].models[0]
  if (config.provider !== 'deepseek') return model

  const legacyMap: Record<string, string> = {
    'deepseek-chat': 'deepseek-v4-flash',
    'deepseek-coder': 'deepseek-v4-flash',
    'deepseek-r1': 'deepseek-v4-pro',
    'deepseek-v3.2': 'deepseek-v4-flash',
  }
  return legacyMap[model] ?? model
}

/** Serialize messages for OpenAI-compatible APIs (DeepSeek is strict about assistant/tool shape). */
export function serializeMessagesForApi(messages: ChatMessage[]): Record<string, unknown>[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.tool_call_id,
        content: message.content,
      }
    }

    if (message.role === 'assistant') {
      const payload: Record<string, unknown> = { role: 'assistant' }
      if (message.tool_calls?.length) {
        payload.tool_calls = message.tool_calls
        payload.content = message.content ?? null
      } else {
        payload.content = message.content ?? ''
      }
      if (message.reasoning_content != null && message.reasoning_content !== '') {
        payload.reasoning_content = message.reasoning_content
      }
      return payload
    }

    return { role: message.role, content: message.content }
  })
}

function buildRequestBody(
  config: AIConfig,
  messages: ChatMessage[],
  tools?: OpenAIToolDefinition[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: resolveAgentModelId(config),
    messages: serializeMessagesForApi(messages),
    temperature: 0.4,
  }

  if (config.provider === 'deepseek') {
    body.thinking = DEEPSEEK_AGENT_THINKING
  }

  if (tools?.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }

  return body
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    const msg =
      data?.error?.message ??
      data?.message ??
      (typeof data?.error === 'string' ? data.error : null)
    if (msg) return String(msg)
    return JSON.stringify(data).slice(0, 400)
  } catch {
    return await response.text().catch(() => '')
  }
}

/**
 * Non-streaming chat completion with optional OpenAI-compatible tools.
 */
export async function sendChatCompletion(
  config: AIConfig,
  messages: ChatMessage[],
  options?: {
    tools?: OpenAIToolDefinition[]
    skipQuotaCheck?: boolean
    signal?: AbortSignal
  },
): Promise<ChatCompletionResult> {
  await reserveQuotaBeforeRequest(options?.skipQuotaCheck)

  if (!supportsAgentToolCalling(config.provider)) {
    throw aiServiceError('agent.error.toolsUnsupported', { provider: config.provider })
  }

  const endpoint = config.endpoint || defaultEndpoints[config.provider]
  const body = buildRequestBody(config, messages, options?.tools)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!response.ok) {
    const detail = await parseApiError(response)
    throw new Error(
      createTranslator(getApiLanguage())('ai.error.httpStatus', { status: response.status }) +
        (detail ? `: ${detail}` : ''),
    )
  }

  const data = await response.json()
  const choice = data.choices?.[0]
  const message = choice?.message ?? {}

  return {
    content: message.content ?? null,
    tool_calls: message.tool_calls,
    reasoning_content: message.reasoning_content ?? null,
    finish_reason: choice?.finish_reason,
  }
}
