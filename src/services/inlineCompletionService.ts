import { sendMessageWithDebounce, type AIConfig } from './aiService'

const MAX_PREFIX_CHARS = 1200
const MAX_SUFFIX_CHARS = 400
const CACHE_MAX = 48
const DEBOUNCE_MS = 450

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

function buildCacheKey(request: InlineCompletionRequest): string {
  const prefix = trimContext(request.prefix, 200, true)
  const suffix = trimContext(request.suffix, 80, false)
  return `${request.filename}:${request.language}:${prefix.length}:${prefix.slice(-80)}:${suffix.slice(0, 40)}`
}

function rememberCache(key: string, value: string): void {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
  cache.set(key, value)
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

    const cacheKey = buildCacheKey(request)
    const cached = cache.get(cacheKey)
    if (cached) return cached

    if (inFlightKey === cacheKey) return null
    inFlightKey = cacheKey

    const prefix = trimContext(request.prefix, MAX_PREFIX_CHARS, true)
    const suffix = trimContext(request.suffix, MAX_SUFFIX_CHARS, false)

    const prompt = `Continue the ${request.language} code in file "${request.filename}".
Return ONLY the next lines to insert at the cursor — no markdown fences, no explanation.

Code before cursor:
\`\`\`
${prefix}
\`\`\`

Code after cursor:
\`\`\`
${suffix}
\`\`\``

    let raw: string
    try {
      raw = await sendMessageWithDebounce(
        request.config,
        [{ role: 'user', content: prompt }],
        undefined,
        { debounceMs: DEBOUNCE_MS, skipDebounce: false },
      )
    } catch {
      return null
    } finally {
      if (inFlightKey === cacheKey) inFlightKey = null
    }

    const cleaned = raw
      .replace(/^```[\w]*\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()

    if (cleaned.length > 0) {
      rememberCache(cacheKey, cleaned)
      return cleaned
    }
    return null
  },
}
