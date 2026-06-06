import { getTabCompletionDebounceMs, getTabCompletionMaxLines } from '../lib/inlineCompletionPrefs'
import {
  classifyTabCompletionFailure,
  getTabCompletionMetrics,
  recordTabCompletionCacheHit,
  recordTabCompletionFailure,
  recordTabCompletionFimAttempt,
  recordTabCompletionFimFallbackToChat,
  recordTabCompletionFimMiddleContext,
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
import { buildChatFimPromptWithMiddle } from '../lib/fimMiddleSegment'
import { fetchFimCompletion, trimCompletionToMaxLines } from './fimCompletionService'
import { fetchPlatformTabCompletion } from './platformAiService'
import {
  appendTabPlusPlusContextToPrompt,
  buildTabPlusPlusContext,
  extendTabCompletionCacheKey,
  type TabPlusPlusContext,
} from '../lib/tabPlusPlusContext'
import { isTabPlusPlusEnabled } from '../lib/v15Features'
import { PROJECT_TASKS_PATH } from './projectTasksService'

const MAX_PREFIX_CHARS = 2000
const MAX_SUFFIX_CHARS = 800
const CACHE_MAX = 128

export interface InlineCompletionRequest {
  prefix: string
  suffix: string
  middle?: string
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
  tabContext?: TabPlusPlusContext | null,
): string {
  const base = buildChatFimPromptWithMiddle(
    request.language,
    request.filename,
    prefix,
    suffix,
    request.middle,
    maxLines,
  )
  return tabContext ? appendTabPlusPlusContextToPrompt(base, tabContext) : base
}

async function resolveTabContextFiles(): Promise<Array<{ name: string; content: string }>> {
  const { useIDEStore } = await import('../store/ideStore')
  return useIDEStore.getState().files.map((file) => ({ name: file.name, content: file.content }))
}

async function resolveTabPlusPlusContext(
  request: InlineCompletionRequest,
  prefix: string,
  suffix: string,
): Promise<TabPlusPlusContext | null> {
  if (!isTabPlusPlusEnabled()) return null
  const openFiles = await resolveTabContextFiles()
  const activeSpecPath = openFiles.some((file) => file.name === PROJECT_TASKS_PATH)
    ? PROJECT_TASKS_PATH
    : null
  return buildTabPlusPlusContext({
    prefix,
    suffix,
    middle: request.middle,
    filename: request.filename,
    openFiles,
    activeSpecPath,
  })
}

async function fetchChatTabCompletion(
  request: InlineCompletionRequest,
  prefix: string,
  suffix: string,
  maxLines: number,
  tabContext?: TabPlusPlusContext | null,
): Promise<string | null> {
  const raw = await sendMessageWithDebounce(
    request.config,
    [{ role: 'user', content: buildChatFimPrompt(request, prefix, suffix, maxLines, tabContext) }],
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
    const prefix = trimContext(request.prefix, MAX_PREFIX_CHARS, true)
    const suffix = trimContext(request.suffix, MAX_SUFFIX_CHARS, false)
    const tabContext = await resolveTabPlusPlusContext(request, prefix, suffix)
    let cacheKey = buildTabCompletionCacheKey(request, maxLines)
    if (tabContext) {
      cacheKey = extendTabCompletionCacheKey(cacheKey, tabContext)
    }
    const cached = cache.get(cacheKey)
    if (cached) {
      recordTabCompletionCacheHit()
      return cached
    }

    if (inFlightKey === cacheKey) return null
    inFlightKey = cacheKey
    recordTabCompletionRequestStart()

    if (request.middle?.trim()) {
      recordTabCompletionFimMiddleContext()
    }
    const started = performance.now()

    try {
      let result: string | null = null
      let path: TabCompletionPath = 'chat'

      if (strategy === 'fim') {
        path = 'fim'
        recordTabCompletionFimAttempt()
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
          undefined,
          tabContext,
        )
      }

      if (!result && strategy !== 'fim') {
        path = 'chat'
        result = await fetchChatTabCompletion(request, prefix, suffix, maxLines, tabContext)
      } else if (!result && strategy === 'fim') {
        recordTabCompletionFimFallbackToChat()
        path = 'chat'
        result = await fetchChatTabCompletion(request, prefix, suffix, maxLines, tabContext)
      }

      if (result && result.length > 0) {
        const latencyMs = Math.round(performance.now() - started)
        recordTabCompletionSuccess(path, latencyMs)
        rememberCache(cacheKey, result)
        return result
      }
      recordTabCompletionFailure('empty', Math.round(performance.now() - started))
      return null
    } catch (error) {
      recordTabCompletionFailure(
        classifyTabCompletionFailure(error),
        Math.round(performance.now() - started),
      )
      return null
    } finally {
      if (inFlightKey === cacheKey) inFlightKey = null
    }
  },
}
