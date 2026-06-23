import type { ChatMessage } from '../../../src/services/agentChatTypes'
import type { OpenAIToolDefinition } from '../../../src/services/agentTools/types'
import { sendAnthropicAgentCompletion } from '../../ai/anthropicAgentCompletion'
import { sendGeminiAgentCompletion } from '../../ai/geminiAgentCompletion'
import type { ChatMessage as BasicChatMessage } from './forwardOpenAiChat'
import { forwardOpenAiAgent, forwardOpenAiChat } from './forwardOpenAiChat'
import type { PlatformAiRoute } from './platformCatalog'

function openAiCompatibleRoute(route: PlatformAiRoute) {
  return {
    provider: route.provider,
    apiKey: route.apiKey,
    endpoint: route.endpoint,
    model: route.model,
  }
}

function buildOpenAiSseResponse(content: string): Response {
  const chunk = JSON.stringify({ choices: [{ delta: { content } }] })
  const body = `data: ${chunk}\n\ndata: [DONE]\n\n`
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-AI-Billing': 'platform',
    },
  })
}

function buildOpenAiJsonResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { role: 'assistant', content } }],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Billing': 'platform',
      },
    },
  )
}

async function forwardAnthropicChat(
  route: PlatformAiRoute,
  messages: BasicChatMessage[],
  options?: { stream?: boolean; signal?: AbortSignal },
): Promise<Response> {
  const systemMessage = messages.find((message) => message.role === 'system')
  const chatMessages = messages.filter((message) => message.role !== 'system')

  const upstream = await fetch(route.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': route.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: route.model,
      system: systemMessage?.content,
      messages: chatMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      max_tokens: 4096,
      stream: false,
    }),
    signal: options?.signal,
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return new Response(
      JSON.stringify({
        error: 'PLATFORM_AI_UPSTREAM_ERROR',
        status: upstream.status,
        detail: detail.slice(0, 500),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const data = (await upstream.json()) as { content?: Array<{ text?: string }> }
  const content = data.content?.[0]?.text ?? ''
  return options?.stream === false ? buildOpenAiJsonResponse(content) : buildOpenAiSseResponse(content)
}

async function forwardGeminiChat(
  route: PlatformAiRoute,
  messages: BasicChatMessage[],
  options?: { stream?: boolean; signal?: AbortSignal },
): Promise<Response> {
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }))

  const systemMessage = messages.find((message) => message.role === 'system')
  const upstream = await fetch(`${route.endpoint}/${route.model}:generateContent?key=${route.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
      contents,
    }),
    signal: options?.signal,
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return new Response(
      JSON.stringify({
        error: 'PLATFORM_AI_UPSTREAM_ERROR',
        status: upstream.status,
        detail: detail.slice(0, 500),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const data = (await upstream.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return options?.stream === false ? buildOpenAiJsonResponse(content) : buildOpenAiSseResponse(content)
}

export async function forwardPlatformChat(
  route: PlatformAiRoute,
  messages: BasicChatMessage[],
  options?: { stream?: boolean; signal?: AbortSignal },
): Promise<Response> {
  switch (route.adapter) {
    case 'openai-chat':
      return forwardOpenAiChat(openAiCompatibleRoute(route), messages, options)
    case 'anthropic-messages':
      return forwardAnthropicChat(route, messages, options)
    case 'gemini-generate':
      return forwardGeminiChat(route, messages, options)
    default:
      return new Response(JSON.stringify({ error: 'PLATFORM_AI_ADAPTER_UNSUPPORTED' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      })
  }
}

export async function forwardPlatformAgent(
  route: PlatformAiRoute,
  input: { messages: unknown[]; tools: unknown[] },
  options?: { signal?: AbortSignal },
): Promise<Response> {
  const messages = input.messages as ChatMessage[]
  const tools = input.tools as OpenAIToolDefinition[]

  switch (route.adapter) {
    case 'openai-chat':
      return forwardOpenAiAgent(openAiCompatibleRoute(route), input, options)
    case 'anthropic-messages': {
      try {
        const result = await sendAnthropicAgentCompletion({
          endpoint: route.endpoint,
          apiKey: route.apiKey,
          model: route.model,
          messages,
          tools,
          signal: options?.signal,
        })
        return new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: result.finish_reason,
                message: {
                  role: 'assistant',
                  content: result.content,
                  tool_calls: result.tool_calls,
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-AI-Billing': 'platform' },
          },
        )
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        return new Response(
          JSON.stringify({ error: 'PLATFORM_AI_UPSTREAM_ERROR', detail: detail.slice(0, 500) }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }
    case 'gemini-generate': {
      try {
        const result = await sendGeminiAgentCompletion({
          endpoint: route.endpoint,
          apiKey: route.apiKey,
          model: route.model,
          messages,
          tools,
          signal: options?.signal,
        })
        return new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: result.finish_reason,
                message: {
                  role: 'assistant',
                  content: result.content,
                  tool_calls: result.tool_calls,
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-AI-Billing': 'platform' },
          },
        )
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        return new Response(
          JSON.stringify({ error: 'PLATFORM_AI_UPSTREAM_ERROR', detail: detail.slice(0, 500) }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }
    default:
      return new Response(JSON.stringify({ error: 'PLATFORM_AI_AGENT_UNSUPPORTED' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      })
  }
}
