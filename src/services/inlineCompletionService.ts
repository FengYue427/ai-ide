import { getTabCompletionMaxLines } from '../lib/inlineCompletionPrefs'
import { sendMessageWithDebounce, type AIConfig } from './aiService'
import { fetchFimCompletion, supportsFimApi, trimCompletionToMaxLines } from './fimCompletionService'

const MAX_PREFIX_CHARS = 1600
const MAX_SUFFIX_CHARS = 600
const CACHE_MAX = 64
const DEBOUNCE_MS = 380

export interface InlineCompletionRequest {
  prefix: string
  suffix: string
  language: string
  filename: string
  config: AIConfig
}

const cache = new Map<string, string>()
let inFlightKey: string | null = null

function trimContext(text: string, maxLen: number, fromEnd: boolean): string {
  if (text.length <= maxLen) return text
  return fromEnd ? text.slice(-maxLen) : text.slice(0, maxLen)
}

function buildCacheKey(request: InlineCompletionRequest, maxLines: number): string {
  const prefix = trimContext(request.prefix, 200, true)
  const suffix = trimContext(request.suffix, 80, false)
  return `${request.filename}:${request.language}:${maxLines}:${prefix.length}:${prefix.slice(-80)}:${suffix.slice(0, 40)}`
}

function rememberCache(key: string, value: string): void {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
  cache.set(key, value)
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```[\w]*\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
}

function buildChatFimPrompt(
  request: InlineCompletionRequest,
  prefix: string,
  suffix: string,
  maxLines: number,
): string {
  return `Continue the ${request.language} code in file "${request.filename}".
Return ONLY the next ${maxLines} line(s) to insert at the cursor (fewer is OK).
No markdown fences, no explanation, no repetition of lines already in the prefix.

Code before cursor:
\`\`\`
${prefix}
\`\`\`

Code after cursor:
\`\`\`
${suffix}
\`\`\``
}

export function clearInlineCompletionCache(): void {
  cache.clear()
  inFlightKey = null
}

export const inlineCompletionService = {
  debounceMs: DEBOUNCE_MS,

  async fetchCompletion(request: InlineCompletionRequest): Promise<string | null> {
    if (!request.config.apiKey?.trim() && request.config.provider !== 'ollama') {
      return null
    }

    const maxLines = getTabCompletionMaxLines()
    const cacheKey = buildCacheKey(request, maxLines)
    const cached = cache.get(cacheKey)
    if (cached) return cached

    if (inFlightKey === cacheKey) return null
    inFlightKey = cacheKey

    const prefix = trimContext(request.prefix, MAX_PREFIX_CHARS, true)
    const suffix = trimContext(request.suffix, MAX_SUFFIX_CHARS, false)

    try {
      let result: string | null = null

      if (supportsFimApi(request.config.provider)) {
        result = await fetchFimCompletion(request.config, prefix, suffix, maxLines)
      }

      if (!result) {
        const raw = await sendMessageWithDebounce(
          request.config,
          [{ role: 'user', content: buildChatFimPrompt(request, prefix, suffix, maxLines) }],
          undefined,
          { debounceMs: DEBOUNCE_MS, skipDebounce: true, skipQuotaCheck: true },
        )
        const cleaned = stripCodeFences(raw)
        result = cleaned.length > 0 ? trimCompletionToMaxLines(cleaned, maxLines) : null
      }

      if (result && result.length > 0) {
        rememberCache(cacheKey, result)
        return result
      }
      return null
    } catch {
      return null
    } finally {
      if (inFlightKey === cacheKey) inFlightKey = null
    }
  },
}
