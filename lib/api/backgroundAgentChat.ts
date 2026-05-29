import { consumeAiUsage } from '../billing/usageDb'
import type { BackgroundAgentAiConfig } from './backgroundAgentConfig'
import { resolveDeepSeekModelId, supportsBackgroundAgentTools } from './backgroundAgentConfig'
import { BACKGROUND_AGENT_TOOL_DEFINITIONS } from './backgroundAgentTools'
import type { OpenAIToolDefinition } from '../../src/services/agentTools/types'

export type BackgroundAgentChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant'
      content?: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
      reasoning_content?: string | null
    }
  | { role: 'tool'; tool_call_id: string; content: string }

export type BackgroundAgentCompletion = {
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  reasoning_content?: string | null
  finish_reason?: string
}

const DEEPSEEK_AGENT_THINKING = { type: 'disabled' as const }

function serializeMessages(messages: BackgroundAgentChatMessage[]): Record<string, unknown>[] {
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

export async function sendBackgroundAgentCompletion(
  userId: string,
  config: BackgroundAgentAiConfig,
  messages: BackgroundAgentChatMessage[],
  options?: { tools?: OpenAIToolDefinition[] },
): Promise<BackgroundAgentCompletion> {
  if (!supportsBackgroundAgentTools(config.provider)) {
    throw new Error(`AGENT_PROVIDER_UNSUPPORTED:${config.provider}`)
  }

  const quota = await consumeAiUsage(userId, 1)
  if (!quota.ok) {
    throw new Error('AI_QUOTA_EXCEEDED')
  }

  const model =
    config.provider === 'deepseek' ? resolveDeepSeekModelId(config.model) : config.model

  const body: Record<string, unknown> = {
    model,
    messages: serializeMessages(messages),
    temperature: 0.4,
  }

  if (config.provider === 'deepseek') {
    body.thinking = DEEPSEEK_AGENT_THINKING
  }

  const tools = options?.tools ?? BACKGROUND_AGENT_TOOL_DEFINITIONS
  if (tools.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await parseApiError(response)
    throw new Error(`AI_HTTP_${response.status}${detail ? `: ${detail}` : ''}`)
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
