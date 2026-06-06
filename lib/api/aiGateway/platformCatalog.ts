import { resolveDeepSeekModelId } from '../backgroundAgentConfig'

export type PlatformProviderId =
  | 'deepseek'
  | 'openai'
  | 'claude'
  | 'google'
  | 'qwen'
  | 'zhipu'
  | 'minimax'
  | 'grok'

export type PlatformAdapterKind = 'openai-chat' | 'anthropic-messages' | 'gemini-generate'

export type PlatformCatalogEntry = {
  id: PlatformProviderId
  adapter: PlatformAdapterKind
  endpoint: string
  envKey: string
  fallbackEnvKeys?: string[]
  defaultModel: string
  models: readonly string[]
}

export const PLATFORM_CATALOG: readonly PlatformCatalogEntry[] = [
  {
    id: 'deepseek',
    adapter: 'openai-chat',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    envKey: 'PLATFORM_DEEPSEEK_API_KEY',
    fallbackEnvKeys: ['BACKGROUND_AGENT_API_KEY'],
    defaultModel: 'deepseek-v4-flash',
    models: [
      'deepseek-v4-pro',
      'deepseek-v4-flash',
      'deepseek-v3.2',
      'deepseek-r1',
      'deepseek-chat',
      'deepseek-coder',
    ],
  },
  {
    id: 'openai',
    adapter: 'openai-chat',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    envKey: 'PLATFORM_OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-5.4', 'gpt-5.4-thinking', 'gpt-5.4-pro', 'gpt-5', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: 'claude',
    adapter: 'anthropic-messages',
    endpoint: 'https://api.anthropic.com/v1/messages',
    envKey: 'PLATFORM_ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4.6',
    models: ['claude-opus-4.7', 'claude-opus-4.6', 'claude-sonnet-4.6', 'claude-sonnet-4.5', 'claude-haiku-4'],
  },
  {
    id: 'google',
    adapter: 'gemini-generate',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    envKey: 'PLATFORM_GOOGLE_API_KEY',
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-3.1-pro',
      'gemini-3-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
    ],
  },
  {
    id: 'qwen',
    adapter: 'openai-chat',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    envKey: 'PLATFORM_QWEN_API_KEY',
    defaultModel: 'qwen-3.5-plus',
    models: ['qwen-3.5-max', 'qwen-3.5-plus', 'qwen-3.5-9b', 'qwen-3.5-4b', 'qwen-3.5-2b'],
  },
  {
    id: 'zhipu',
    adapter: 'openai-chat',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    envKey: 'PLATFORM_ZHIPU_API_KEY',
    defaultModel: 'glm-4-flash',
    models: ['glm-5', 'glm-5.1', 'glm-4-plus', 'glm-4-flash'],
  },
  {
    id: 'minimax',
    adapter: 'openai-chat',
    endpoint: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    envKey: 'PLATFORM_MINIMAX_API_KEY',
    defaultModel: 'minimax-m2.5-lightning',
    models: ['minimax-m2.5', 'minimax-m2.5-lightning'],
  },
  {
    id: 'grok',
    adapter: 'openai-chat',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    envKey: 'PLATFORM_GROK_API_KEY',
    defaultModel: 'grok-4.20',
    models: ['grok-4.20', 'grok-4.20-reasoning'],
  },
] as const

export type PlatformAiRoute = {
  provider: PlatformProviderId
  adapter: PlatformAdapterKind
  apiKey: string
  endpoint: string
  model: string
}

export type ResolvePlatformAiResult =
  | { ok: true; route: PlatformAiRoute }
  | { ok: false; reason: string }

const CATALOG_BY_ID = new Map(PLATFORM_CATALOG.map((entry) => [entry.id, entry]))

export function parsePlatformProviderId(raw: string | undefined): PlatformProviderId | null {
  const value = raw?.trim().toLowerCase()
  if (!value) return null
  return CATALOG_BY_ID.has(value as PlatformProviderId) ? (value as PlatformProviderId) : null
}

export function listConfiguredPlatformProviders(): PlatformProviderId[] {
  return PLATFORM_CATALOG.filter((entry) => resolveCatalogApiKey(entry)).map((entry) => entry.id)
}

export function resolveCatalogApiKey(entry: PlatformCatalogEntry): string | null {
  const primary = process.env[entry.envKey]?.trim()
  if (primary) return primary
  for (const fallbackKey of entry.fallbackEnvKeys ?? []) {
    const fallback = process.env[fallbackKey]?.trim()
    if (fallback) return fallback
  }
  return null
}

export function resolveCatalogModel(entry: PlatformCatalogEntry, requested?: string): string {
  const modelRaw = requested?.trim() || process.env.PLATFORM_AI_MODEL?.trim() || entry.defaultModel
  if (entry.id === 'deepseek') return resolveDeepSeekModelId(modelRaw)
  if (entry.models.includes(modelRaw)) return modelRaw
  return entry.defaultModel
}

export function resolvePlatformCatalogRoute(requested?: {
  provider?: string
  model?: string
}): ResolvePlatformAiResult {
  const provider =
    parsePlatformProviderId(requested?.provider) ??
    parsePlatformProviderId(process.env.PLATFORM_AI_PROVIDER) ??
    'deepseek'
  const entry = CATALOG_BY_ID.get(provider)
  if (!entry) {
    return { ok: false, reason: 'PLATFORM_AI_PROVIDER_UNSUPPORTED' }
  }

  const apiKey = resolveCatalogApiKey(entry)
  if (!apiKey) {
    return { ok: false, reason: 'PLATFORM_AI_KEY_MISSING' }
  }

  return {
    ok: true,
    route: {
      provider: entry.id,
      adapter: entry.adapter,
      apiKey,
      endpoint: entry.endpoint,
      model: resolveCatalogModel(entry, requested?.model),
    },
  }
}

export function isPlatformProviderConfigured(provider: PlatformProviderId): boolean {
  const entry = CATALOG_BY_ID.get(provider)
  if (!entry) return false
  return Boolean(resolveCatalogApiKey(entry))
}

export function getPlatformCatalogEntry(provider: PlatformProviderId): PlatformCatalogEntry | undefined {
  return CATALOG_BY_ID.get(provider)
}
