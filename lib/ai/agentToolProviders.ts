/** Providers that support the Agent tool loop (OpenAI-shaped message contract). */

export const AGENT_TOOL_OPENAI_PROVIDERS = [
  'openai',
  'deepseek',
  'grok',
  'zhipu',
  'minimax',
  'qwen',
] as const

export const AGENT_TOOL_ANTHROPIC_PROVIDERS = ['claude'] as const

export const AGENT_TOOL_GEMINI_PROVIDERS = ['google'] as const

export type AgentToolOpenAiProvider = (typeof AGENT_TOOL_OPENAI_PROVIDERS)[number]
export type AgentToolAnthropicProvider = (typeof AGENT_TOOL_ANTHROPIC_PROVIDERS)[number]
export type AgentToolGeminiProvider = (typeof AGENT_TOOL_GEMINI_PROVIDERS)[number]

export type AgentToolProvider =
  | AgentToolOpenAiProvider
  | AgentToolAnthropicProvider
  | AgentToolGeminiProvider

export type AgentToolAdapterKind = 'openai' | 'anthropic' | 'gemini'

export function getAgentToolAdapterKind(provider: string): AgentToolAdapterKind | null {
  const value = provider.trim().toLowerCase()
  if ((AGENT_TOOL_OPENAI_PROVIDERS as readonly string[]).includes(value)) return 'openai'
  if ((AGENT_TOOL_ANTHROPIC_PROVIDERS as readonly string[]).includes(value)) return 'anthropic'
  if ((AGENT_TOOL_GEMINI_PROVIDERS as readonly string[]).includes(value)) return 'gemini'
  return null
}

export function supportsAgentToolProvider(provider: string): boolean {
  return getAgentToolAdapterKind(provider) != null
}

export function listAgentToolProviders(): AgentToolProvider[] {
  return [
    ...AGENT_TOOL_OPENAI_PROVIDERS,
    ...AGENT_TOOL_ANTHROPIC_PROVIDERS,
    ...AGENT_TOOL_GEMINI_PROVIDERS,
  ]
}
