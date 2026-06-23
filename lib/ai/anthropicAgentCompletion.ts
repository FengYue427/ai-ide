import type { ChatCompletionResult, ChatMessage, ChatToolCall } from '../../src/services/agentChatTypes'
import type { OpenAIToolDefinition } from '../../src/services/agentTools/types'

type AnthropicTool = {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string }

type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string | AnthropicContentBlock[]
}

export function openAiToolsToAnthropic(tools: OpenAIToolDefinition[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }))
}

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function chatMessagesToAnthropic(messages: ChatMessage[]): {
  system?: string
  messages: AnthropicMessage[]
} {
  const systemParts: string[] = []
  const anthropicMessages: AnthropicMessage[] = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content)
      continue
    }

    if (message.role === 'user') {
      anthropicMessages.push({ role: 'user', content: message.content })
      continue
    }

    if (message.role === 'assistant') {
      const blocks: AnthropicContentBlock[] = []
      if (message.content?.trim()) {
        blocks.push({ type: 'text', text: message.content })
      }
      for (const call of message.tool_calls ?? []) {
        blocks.push({
          type: 'tool_use',
          id: call.id,
          name: call.function.name,
          input: parseToolArguments(call.function.arguments),
        })
      }
      anthropicMessages.push({
        role: 'assistant',
        content: blocks.length === 1 && blocks[0]?.type === 'text' ? blocks[0].text : blocks,
      })
      continue
    }

    if (message.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: message.tool_call_id, content: message.content }],
      })
    }
  }

  return {
    system: systemParts.length ? systemParts.join('\n\n') : undefined,
    messages: anthropicMessages,
  }
}

export function anthropicResponseToChatCompletion(data: {
  content?: AnthropicContentBlock[]
  stop_reason?: string
}): ChatCompletionResult {
  const blocks = data.content ?? []
  const textParts = blocks.filter((block): block is { type: 'text'; text: string } => block.type === 'text')
  const toolUses = blocks.filter(
    (block): block is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
      block.type === 'tool_use',
  )

  const tool_calls: ChatToolCall[] = toolUses.map((block) => ({
    id: block.id,
    type: 'function',
    function: {
      name: block.name,
      arguments: JSON.stringify(block.input ?? {}),
    },
  }))

  const content = textParts.map((block) => block.text).join('').trim()

  return {
    content: content || null,
    tool_calls: tool_calls.length ? tool_calls : undefined,
    finish_reason: tool_calls.length ? 'tool_calls' : data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
  }
}

export async function sendAnthropicAgentCompletion(input: {
  endpoint: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  tools?: OpenAIToolDefinition[]
  signal?: AbortSignal
}): Promise<ChatCompletionResult> {
  const { system, messages } = chatMessagesToAnthropic(input.messages)
  const body: Record<string, unknown> = {
    model: input.model,
    max_tokens: 4096,
    temperature: 0.4,
    messages,
  }
  if (system) body.system = system
  if (input.tools?.length) {
    body.tools = openAiToolsToAnthropic(input.tools)
    body.tool_choice = { type: 'auto' }
  }

  const response = await fetch(input.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: input.signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Anthropic agent HTTP ${response.status}${detail ? `: ${detail.slice(0, 400)}` : ''}`)
  }

  const data = (await response.json()) as {
    content?: AnthropicContentBlock[]
    stop_reason?: string
  }
  return anthropicResponseToChatCompletion(data)
}
