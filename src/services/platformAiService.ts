import { apiFetch } from '../services/apiUtils'
import { createTranslator } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'
import { isPlatformCloudProvider } from '../lib/platformModelCatalog'
import type { TabPlusPlusContext } from '../lib/tabPlusPlusContext'
import { appendTabPlusPlusContextToPrompt } from '../lib/tabPlusPlusContext'
import type { AIConfig } from './aiService'
import { extractUserFacingStreamDelta, sanitizeChatAssistantOutput, type StreamDeltaFields } from './chatOutputSanitizer'

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
  const response = await apiFetch('/api/ai/chat', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: isPlatformCloudProvider(config.provider) ? config.provider : 'deepseek',
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
    return sanitizeChatAssistantOutput(data.choices?.[0]?.message?.content ?? '')
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
          choices?: Array<{ delta?: StreamDeltaFields }>
        }
        const content = extractUserFacingStreamDelta(data.choices?.[0]?.delta)
        if (content) {
          fullContent += content
          onStream(content)
        }
      } catch {
        /* ignore partial SSE */
      }
    }
  }

  return sanitizeChatAssistantOutput(fullContent)
}

function buildPlatformTabPrompt(
  language: string,
  filename: string,
  prefix: string,
  suffix: string,
  maxLines: number,
): string {
  return `Continue the ${language} code in file "${filename}".
Return ONLY the next ${maxLines} line(s) to insert at the cursor.
No markdown fences, no explanation.

Before cursor:
${prefix}

After cursor:
${suffix}`
}

/** Platform-held key tab completion (chat-shaped FIM fallback). */
export async function fetchPlatformTabCompletion(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
  language: string,
  filename: string,
  signal?: AbortSignal,
  tabContext?: TabPlusPlusContext | null,
): Promise<string | null> {
  const { trimCompletionToMaxLines } = await import('./fimCompletionService')
  let content = buildPlatformTabPrompt(language, filename, prefix, suffix, maxLines)
  if (tabContext) {
    content = appendTabPlusPlusContextToPrompt(content, tabContext)
  }
  const raw = await sendPlatformMessage(
    config,
    [
      {
        role: 'system',
        content: 'You are a code completion engine. Output only code to insert at the cursor.',
      },
      { role: 'user', content },
    ],
    undefined,
    signal,
  )
  const cleaned = raw
    .replace(/^```[\w]*\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
  if (!cleaned) return null
  return trimCompletionToMaxLines(cleaned, maxLines)
}

