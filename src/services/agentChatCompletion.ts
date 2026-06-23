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
import { shouldUsePlatformAi } from '../lib/aiPlatformMode'
import { isPlatformCloudProvider } from '../lib/platformModelCatalog'
import { reserveAIUsageFromStore } from './usageService'
import { sanitizeChatAssistantOutput } from './chatOutputSanitizer'
import { getAgentToolAdapterKind, supportsAgentToolProvider } from '../../lib/ai/agentToolProviders'
import { sendAnthropicAgentCompletion } from '../../lib/ai/anthropicAgentCompletion'
import { sendGeminiAgentCompletion } from '../../lib/ai/geminiAgentCompletion'

/** @deprecated use supportsAgentToolProvider from lib/ai/agentToolProviders */
export function supportsAgentToolCalling(provider: AIModel): boolean {
  if (import.meta.env.VITE_AGENT_TOOLS === '0') return false
  return supportsAgentToolProvider(provider)
}

/** DeepSeek V4 tool loop: disable thinking to avoid 400 without reasoning_content round-trip */
const DEEPSEEK_AGENT_THINKING = { type: 'disabled' as const }

/** Agent tool loop requires OpenAI-compatible chat completions (DashScope compatible-mode for Qwen). */
export function resolveAgentEndpoint(config: AIConfig): string {
  if (config.endpoint?.trim()) return config.endpoint.trim()
  if (config.provider === 'qwen') {
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
  }
  return defaultEndpoints[config.provider]
}

function aiServiceError(key: TranslationKey, params?: Record<string, string | number>): Error {
  return new Error(createTranslator(getApiLanguage())(key, params))
}

async function reserveQuotaBeforeRequest(skipQuotaCheck?: boolean): Promise<void> {
  await reserveAIUsageFromStore(skipQuotaCheck)
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
async function isUserLoggedIn(): Promise<boolean> {
  const { useIDEStore } = await import('../store/ideStore')
  return Boolean(useIDEStore.getState().currentUser)
}

async function sendPlatformAgentCompletionViaGateway(
  config: AIConfig,
  messages: ChatMessage[],
  options?: {
    tools?: OpenAIToolDefinition[]
    signal?: AbortSignal
  },
): Promise<ChatCompletionResult> {
  const { parsePlatformError } = await import('./platformAiService')
  const { apiFetch } = await import('./apiUtils')
  const response = await apiFetch('/api/ai/chat', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: isPlatformCloudProvider(config.provider) ? config.provider : 'deepseek',
      model: resolveAgentModelId(config),
      messages: serializeMessagesForApi(messages),
      tools: options?.tools ?? [],
      stream: false,
    }),
    signal: options?.signal,
  })

  if (!response.ok) {
    throw await parsePlatformError(response)
  }

  const data = (await response.json()) as {
    choices?: Array<{
      finish_reason?: string
      message?: {
        content?: string | null
        tool_calls?: ChatCompletionResult['tool_calls']
        reasoning_content?: string | null
      }
    }>
  }

  const choice = data.choices?.[0]
  const message = choice?.message ?? {}

  return {
    content: sanitizeChatAssistantOutput(message.content ?? '') || null,
    tool_calls: message.tool_calls,
    reasoning_content: message.reasoning_content ?? null,
    finish_reason: choice?.finish_reason,
  }
}

export async function sendChatCompletion(
  config: AIConfig,
  messages: ChatMessage[],
  options?: {
    tools?: OpenAIToolDefinition[]
    skipQuotaCheck?: boolean
    signal?: AbortSignal
    loggedIn?: boolean
  },
): Promise<ChatCompletionResult> {
  const loggedIn = options?.loggedIn ?? (await isUserLoggedIn())
  if (shouldUsePlatformAi(config, loggedIn)) {
    return sendPlatformAgentCompletionViaGateway(config, messages, options)
  }

  await reserveQuotaBeforeRequest(options?.skipQuotaCheck)

  if (!supportsAgentToolCalling(config.provider)) {
    throw aiServiceError('agent.error.toolsUnsupported', { provider: config.provider })
  }

  const adapter = getAgentToolAdapterKind(config.provider)
  if (adapter === 'anthropic') {
    const result = await sendAnthropicAgentCompletion({
      endpoint: resolveAgentEndpoint(config),
      apiKey: config.apiKey,
      model: resolveAgentModelId(config),
      messages,
      tools: options?.tools,
      signal: options?.signal,
    })
    return {
      ...result,
      content: sanitizeChatAssistantOutput(result.content ?? '') || null,
    }
  }

  if (adapter === 'gemini') {
    const result = await sendGeminiAgentCompletion({
      endpoint: resolveAgentEndpoint(config),
      apiKey: config.apiKey,
      model: resolveAgentModelId(config),
      messages,
      tools: options?.tools,
      signal: options?.signal,
    })
    return {
      ...result,
      content: sanitizeChatAssistantOutput(result.content ?? '') || null,
    }
  }

  const endpoint = resolveAgentEndpoint(config)
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
    content: sanitizeChatAssistantOutput(message.content ?? '') || null,
    tool_calls: message.tool_calls,
    reasoning_content: message.reasoning_content ?? null,
    finish_reason: choice?.finish_reason,
  }
}
