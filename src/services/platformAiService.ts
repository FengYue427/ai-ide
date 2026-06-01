import { createTranslator } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'
import type { AIConfig } from './aiService'

export type PlatformChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function platformAiError(message: string): Error {
  return new Error(message)
}

export async function parsePlatformError(response: Response): Promise<Error> {
  const t = createTranslator(getApiLanguage())
  try {
    const data = (await response.json()) as {
      errorKey?: string
      error?: string
      quota?: unknown
    }
    if (response.status === 429) {
      return platformAiError(t('usage.quota.exceeded', { used: '—', limit: '—' }))
    }
    if (response.status === 401) {
      return platformAiError(t('notify.sessionExpired'))
    }
    if (response.status === 503) {
      return platformAiError(t('ai.error.platformUnavailable'))
    }
    return platformAiError(data.error ?? t('ai.error.platformFailed'))
  } catch {
    return platformAiError(t('ai.error.httpStatus', { status: response.status }))
  }
}

/** Stream SSE from POST /api/ai/chat (platform-held API key). */
export async function sendPlatformMessage(
  config: AIConfig,
  messages: PlatformChatMessage[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider === 'openai' || config.provider === 'deepseek' ? config.provider : 'deepseek',
      model: config.model,
      messages,
      stream: Boolean(onStream),
    }),
    signal,
  })

  if (!response.ok) {
    throw await parsePlatformError(response)
  }

  if (!onStream || !response.body) {
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content ?? ''
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    if (signal?.aborted) {
      reader.cancel()
      throw platformAiError(createTranslator(getApiLanguage())('ai.error.aborted'))
    }

    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      if (line === 'data: [DONE]') continue
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6)) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const content = data.choices?.[0]?.delta?.content ?? ''
        if (content) {
          fullContent += content
          onStream(content)
        }
      } catch {
        /* ignore partial SSE */
      }
    }
  }

  return fullContent
}

