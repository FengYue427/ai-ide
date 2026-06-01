import type { PlatformAiRoute } from './platformConfig'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Proxy OpenAI-compatible chat (streaming SSE) with platform credentials. */
export async function forwardOpenAiChat(
  route: PlatformAiRoute,
  messages: ChatMessage[],
  options?: { stream?: boolean; signal?: AbortSignal },
): Promise<Response> {
  const stream = options?.stream !== false
  const upstream = await fetch(route.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${route.apiKey}`,
    },
    body: JSON.stringify({
      model: route.model,
      messages,
      temperature: 0.7,
      stream,
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
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const headers = new Headers(upstream.headers)
  headers.set('X-AI-Billing', 'platform')
  if (stream && !headers.get('Content-Type')) {
    headers.set('Content-Type', 'text/event-stream; charset=utf-8')
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}

/** Agent tool loop — non-streaming JSON completion. */
export async function forwardOpenAiAgent(
  route: PlatformAiRoute,
  input: { messages: unknown[]; tools: unknown[] },
  options?: { signal?: AbortSignal },
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: route.model,
    messages: input.messages,
    temperature: 0.4,
    tools: input.tools,
    tool_choice: 'auto',
    stream: false,
  }

  if (route.provider === 'deepseek') {
    body.thinking = { type: 'disabled' }
  }

  const upstream = await fetch(route.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${route.apiKey}`,
    },
    body: JSON.stringify(body),
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
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      'X-AI-Billing': 'platform',
    },
  })
}
