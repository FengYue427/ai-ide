import { resolveDeepSeekModelId } from '../backgroundAgentConfig'

export type PlatformAiProvider = 'deepseek' | 'openai'

export type PlatformAiRoute = {
  provider: PlatformAiProvider
  apiKey: string
  endpoint: string
  model: string
}

export type ResolvePlatformAiResult =
  | { ok: true; route: PlatformAiRoute }
  | { ok: false; reason: string }

const ENDPOINTS: Record<PlatformAiProvider, string> = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
}

const DEFAULT_MODELS: Record<PlatformAiProvider, string> = {
  deepseek: 'deepseek-v4-flash',
  openai: 'gpt-4o-mini',
}

function parseProvider(raw: string | undefined): PlatformAiProvider {
  const v = raw?.trim().toLowerCase()
  return v === 'openai' ? 'openai' : 'deepseek'
}

function resolveApiKey(provider: PlatformAiProvider): string | null {
  if (provider === 'openai') {
    return process.env.PLATFORM_OPENAI_API_KEY?.trim() || null
  }
  return (
    process.env.PLATFORM_DEEPSEEK_API_KEY?.trim() ||
    process.env.BACKGROUND_AGENT_API_KEY?.trim() ||
    null
  )
}

/** Server-side platform LLM route (keys never sent to browser). */
export function resolvePlatformAiRoute(requested?: {
  provider?: string
  model?: string
}): ResolvePlatformAiResult {
  const provider = parseProvider(requested?.provider ?? process.env.PLATFORM_AI_PROVIDER)
  const apiKey = resolveApiKey(provider)
  if (!apiKey) {
    return { ok: false, reason: 'PLATFORM_AI_KEY_MISSING' }
  }

  const modelRaw = requested?.model?.trim() || process.env.PLATFORM_AI_MODEL?.trim() || DEFAULT_MODELS[provider]
  const model = provider === 'deepseek' ? resolveDeepSeekModelId(modelRaw) : modelRaw

  return {
    ok: true,
    route: {
      provider,
      apiKey,
      endpoint: ENDPOINTS[provider],
      model,
    },
  }
}

export function isPlatformAiConfigured(): boolean {
  return resolvePlatformAiRoute().ok
}
