import { getTabCompletionDebounceMs, getTabCompletionMaxLines } from '../lib/inlineCompletionPrefs'
import {
  classifyTabCompletionFailure,
  getTabCompletionMetrics,
  recordTabCompletionCacheHit,
  recordTabCompletionFailure,
  recordTabCompletionRequestStart,
  recordTabCompletionSkipped,
  recordTabCompletionSuccess,
  resetTabCompletionMetrics,
  type TabCompletionPath,
} from '../lib/inlineCompletionMetrics'
import { shouldSkipTabCompletionRequest } from '../lib/tabCompletionRequestGate'
import { resolveTabCompletionStrategy } from '../lib/tabCompletionStrategy'
import { isAiConfigured } from '../lib/aiPlatformMode'
import { sendMessageWithDebounce, type AIConfig } from './aiService'
import { fetchFimCompletion, trimCompletionToMaxLines } from './fimCompletionService'
import { fetchPlatformTabCompletion } from './platformAiService'

const MAX_PREFIX_CHARS = 2000
const MAX_SUFFIX_CHARS = 800
const CACHE_MAX = 128

export interface InlineCompletionRequest {
  prefix: string
  suffix: string
  language: string
  filename: string
  config: AIConfig
  loggedIn?: boolean
}

const cache = new Map<string, string>()
let inFlightKey: string | null = null

function trimContext(text: string, maxLen: number, fromEnd: boolean): string {
  if (text.length <= maxLen) return text
  return fromEnd ? text.slice(-maxLen) : text.slice(0, maxLen)
}

export function buildTabCompletionCacheKey(request: InlineCompletionRequest, maxLines: number): string {
  const prefix = trimContext(request.prefix, 200, true)
  const suffix = trimContext(request.suffix, 80, false)
  const suffixKey = suffix.length === 0 ? '|eof' : suffix.slice(0, 40)
  return `${request.filename}:${request.language}:${maxLines}:${prefix.length}:${prefix.slice(-80)}:${suffixKey}`
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

async function fetchChatTabCompletion(
  request: InlineCompletionRequest,
  prefix: string,
  suffix: string,
  maxLines: number,
): Promise<string | null> {
  const raw = await sendMessageWithDebounce(
    request.config,
    [{ role: 'user', content: buildChatFimPrompt(request, prefix, suffix, maxLines) }],
    undefined,
    {
      debounceMs: getTabCompletionDebounceMs(),
      skipDebounce: true,
      skipQuotaCheck: true,
      loggedIn: request.loggedIn,
    },
  )
  const cleaned = stripCodeFences(raw)
  return cleaned.length > 0 ? trimCompletionToMaxLines(cleaned, maxLines) : null
}

export function clearInlineCompletionCache(): void {
  cache.clear()
  inFlightKey = null
}

export { getTabCompletionMetrics, resetTabCompletionMetrics }

export const inlineCompletionService = {
  get debounceMs() {
    return getTabCompletionDebounceMs()
  },

  async fetchCompletion(request: InlineCompletionRequest): Promise<string | null> {
    if (!isAiConfigured(request.config, Boolean(request.loggedIn))) {
      return null
    }

    const strategy = resolveTabCompletionStrategy(request.config, Boolean(request.loggedIn))
    if (strategy === 'none') return null

    if (shouldSkipTabCompletionRequest(request.prefix)) {
      recordTabCompletionSkipped()
      return null
    }

    const maxLines = getTabCompletionMaxLines()
    const cacheKey = buildTabCompletionCacheKey(request, maxLines)
    const cached = cache.get(cacheKey)
    if (cached) {
      recordTabCompletionCacheHit()
      return cached
    }

    if (inFlightKey === cacheKey) return null
    inFlightKey = cacheKey
    recordTabCompletionRequestStart()

    const prefix = trimContext(request.prefix, MAX_PREFIX_CHARS, true)
    const suffix = trimContext(request.suffix, MAX_SUFFIX_CHARS, false)
    const started = performance.now()

    try {
      let result: string | null = null
      let path: TabCompletionPath = 'chat'

      if (strategy === 'fim') {
        path = 'fim'
        result = await fetchFimCompletion(request.config, prefix, suffix, maxLines)
      } else if (strategy === 'platform') {
        path = 'platform'
        result = await fetchPlatformTabCompletion(
          request.config,
          prefix,
          suffix,
          maxLines,
          request.language,
          request.filename,
        )
      }

      if (!result && strategy !== 'fim') {
        path = 'chat'
        result = await fetchChatTabCompletion(request, prefix, suffix, maxLines)
      } else if (!result && strategy === 'fim') {
        path = 'chat'
        result = await fetchChatTabCompletion(request, prefix, suffix, maxLines)
      }

      if (result && result.length > 0) {
        const latencyMs = Math.round(performance.now() - started)
        recordTabCompletionSuccess(path, latencyMs)
        rememberCache(cacheKey, result)
        return result
      }
      recordTabCompletionFailure('empty')
      return null
    } catch (error) {
      recordTabCompletionFailure(classifyTabCompletionFailure(error))
      return null
    } finally {
      if (inFlightKey === cacheKey) inFlightKey = null
    }
  },
}
