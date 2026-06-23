import type { ChatCompletionResult, ChatMessage, ChatToolCall } from '../../src/services/agentChatTypes'
import type { OpenAIToolDefinition } from '../../src/services/agentTools/types'

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { output: string } } }

type GeminiContent = {
  role: 'user' | 'model'
  parts: GeminiPart[]
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

export function openAiToolsToGemini(tools: OpenAIToolDefinition[]) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      })),
    },
  ]
}

function toolNameFromMessages(messages: ChatMessage[], toolCallId: string): string {
  for (const candidate of messages) {
    if (candidate.role !== 'assistant') continue
    const match = candidate.tool_calls?.find((call) => call.id === toolCallId)
    if (match) return match.function.name
  }
  return 'tool'
}

export function chatMessagesToGemini(messages: ChatMessage[]): {
  systemInstruction?: { parts: Array<{ text: string }> }
  contents: GeminiContent[]
} {
  const systemParts: string[] = []
  const contents: GeminiContent[] = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content)
      continue
    }

    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.content }] })
      continue
    }

    if (message.role === 'assistant') {
      const parts: GeminiPart[] = []
      if (message.content?.trim()) {
        parts.push({ text: message.content })
      }
      for (const call of message.tool_calls ?? []) {
        parts.push({
          functionCall: {
            name: call.function.name,
            args: parseToolArguments(call.function.arguments),
          },
        })
      }
      if (parts.length) {
        contents.push({ role: 'model', parts })
      }
      continue
    }

    if (message.role === 'tool') {
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolNameFromMessages(messages, message.tool_call_id),
              response: { output: message.content },
            },
          },
        ],
      })
    }
  }

  return {
    systemInstruction: systemParts.length ? { parts: [{ text: systemParts.join('\n\n') }] } : undefined,
    contents,
  }
}

export function geminiResponseToChatCompletion(data: {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>
}): ChatCompletionResult {
  const parts = data.candidates?.[0]?.content?.parts ?? []
  const text = parts
    .map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim()
  const functionCalls = parts.filter(
    (part): part is { functionCall: { name: string; args: Record<string, unknown> } } =>
      'functionCall' in part,
  )

  const tool_calls: ChatToolCall[] = functionCalls.map((part, index) => ({
    id: `call_gemini_${index}_${part.functionCall.name}`,
    type: 'function',
    function: {
      name: part.functionCall.name,
      arguments: JSON.stringify(part.functionCall.args ?? {}),
    },
  }))

  const finishReason = data.candidates?.[0]?.finishReason
  return {
    content: text || null,
    tool_calls: tool_calls.length ? tool_calls : undefined,
    finish_reason: tool_calls.length ? 'tool_calls' : finishReason === 'STOP' ? 'stop' : finishReason?.toLowerCase(),
  }
}

export async function sendGeminiAgentCompletion(input: {
  endpoint: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  tools?: OpenAIToolDefinition[]
  signal?: AbortSignal
}): Promise<ChatCompletionResult> {
  const { systemInstruction, contents } = chatMessagesToGemini(input.messages)
  const body: Record<string, unknown> = { contents }
  if (systemInstruction) body.systemInstruction = systemInstruction
  if (input.tools?.length) {
    body.tools = openAiToolsToGemini(input.tools)
  }

  const response = await fetch(`${input.endpoint}/${input.model}:generateContent?key=${input.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: input.signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gemini agent HTTP ${response.status}${detail ? `: ${detail.slice(0, 400)}` : ''}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>
    error?: { message?: string }
  }
  if (data.error?.message) {
    throw new Error(data.error.message)
  }
  return geminiResponseToChatCompletion(data)
}
