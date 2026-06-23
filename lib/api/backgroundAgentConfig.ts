export type BackgroundAgentProvider =
  | 'openai'
  | 'deepseek'
  | 'grok'
  | 'zhipu'
  | 'minimax'
  | 'qwen'

export type BackgroundAgentAiConfig = {
  provider: BackgroundAgentProvider
  apiKey: string
  model: string
  endpoint: string
}

const TOOL_PROVIDERS: BackgroundAgentProvider[] = [
  'openai',
  'deepseek',
  'grok',
  'zhipu',
  'minimax',
  'qwen',
]

const DEFAULT_ENDPOINTS: Record<BackgroundAgentProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  grok: 'https://api.x.ai/v1/chat/completions',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  minimax: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
}

const DEFAULT_MODELS: Record<BackgroundAgentProvider, string> = {
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-v4-flash',
  grok: 'grok-4.20',
  zhipu: 'glm-4-flash',
  minimax: 'minimax-m2.5',
  qwen: 'qwen-3.5-plus',
}

const DEEPSEEK_LEGACY: Record<string, string> = {
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-coder': 'deepseek-v4-flash',
  'deepseek-r1': 'deepseek-v4-pro',
  'deepseek-v3.2': 'deepseek-v4-flash',
}

function parseProvider(raw: string | undefined): BackgroundAgentProvider | null {
  const v = raw?.trim().toLowerCase()
  if (v && (TOOL_PROVIDERS as readonly string[]).includes(v)) {
    return v as BackgroundAgentProvider
  }
  return null
}

export function resolveDeepSeekModelId(model: string): string {
  return DEEPSEEK_LEGACY[model] ?? model
}

export function resolveBackgroundAgentMaxRounds(): number {
  const raw = process.env.BACKGROUND_AGENT_MAX_ROUNDS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : 8
  if (!Number.isFinite(n)) return 8
  return Math.min(16, Math.max(1, n))
}

export type ResolveBackgroundAgentConfigResult =
  | { ok: true; config: BackgroundAgentAiConfig }
  | { ok: false; error: string }

/**
 * Cloud background agent uses a platform API key (not browser localStorage).
 * Workspace settings may override provider/model only.
 */
export function resolveBackgroundAgentAiConfig(
  workspaceSettingsJson?: string | null,
): ResolveBackgroundAgentConfigResult {
  const apiKey = process.env.BACKGROUND_AGENT_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'BACKGROUND_AGENT_API_KEY_MISSING' }
  }

  let settingsProvider: string | undefined
  let settingsModel: string | undefined
  if (workspaceSettingsJson?.trim()) {
    try {
      const parsed = JSON.parse(workspaceSettingsJson) as {
        aiProvider?: unknown
        aiModel?: unknown
      }
      if (typeof parsed.aiProvider === 'string') settingsProvider = parsed.aiProvider
      if (typeof parsed.aiModel === 'string') settingsModel = parsed.aiModel
    } catch {
      // ignore malformed settings
    }
  }

  const provider =
    parseProvider(process.env.BACKGROUND_AGENT_PROVIDER) ??
    parseProvider(settingsProvider) ??
    'deepseek'

  if (!TOOL_PROVIDERS.includes(provider)) {
    return { ok: false, error: 'BACKGROUND_AGENT_PROVIDER_UNSUPPORTED' }
  }

  let model =
    process.env.BACKGROUND_AGENT_MODEL?.trim() ||
    settingsModel?.trim() ||
    DEFAULT_MODELS[provider]

  if (provider === 'deepseek') {
    model = resolveDeepSeekModelId(model)
  }

  return {
    ok: true,
    config: {
      provider,
      apiKey,
      model,
      endpoint: DEFAULT_ENDPOINTS[provider],
    },
  }
}

export function supportsBackgroundAgentTools(provider: BackgroundAgentProvider): boolean {
  return TOOL_PROVIDERS.includes(provider)
}
