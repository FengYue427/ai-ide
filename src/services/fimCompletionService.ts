/**
 * Fill-in-the-Middle (FIM) completion service — Phase 1.2
 *
 * 扩展支持：DeepSeek / Ollama / Qwen（通义千问）
 * 其余 provider 回退到 chat-based 补全（inlineCompletionService 负责）
 */
import type { AIConfig } from './aiService'

const FIM_TIMEOUT_MS = 8_000   // 从 12s 降到 8s，提升响应感

// ─── Provider 支持表 ────────────────────────────────────────────────────────

/** 支持原生 FIM API 的 provider */
export function supportsFimApi(provider: AIConfig['provider']): boolean {
  return provider === 'deepseek' || provider === 'ollama' || provider === 'qwen'
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

export function trimCompletionToMaxLines(text: string, maxLines: number): string {
  const normalized = text.replace(/\r\n/g, '\n').trimEnd()
  if (maxLines < 1) return ''
  const lines = normalized.split('\n')
  if (lines.length <= maxLines) return normalized
  return lines.slice(0, maxLines).join('\n')
}

/** 去掉补全结果中重复的 prefix 尾部（部分模型会回显） */
function stripPrefixEcho(completion: string, prefix: string): string {
  const prefixTail = prefix.slice(-80).trimStart()
  if (prefixTail && completion.startsWith(prefixTail)) {
    return completion.slice(prefixTail.length)
  }
  return completion
}

// ─── DeepSeek FIM ────────────────────────────────────────────────────────────

const DEEPSEEK_FIM_URL = 'https://api.deepseek.com/beta/completions'

function resolveDeepSeekFimModel(config: AIConfig): string {
  const model = config.model?.trim()
  if (model && /coder/i.test(model)) return model
  return 'deepseek-coder'
}

async function fetchDeepSeekFim(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch(DEEPSEEK_FIM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: resolveDeepSeekFimModel(config),
      prompt: prefix,
      suffix,
      max_tokens: Math.min(256, maxLines * 60),
      temperature: 0.1,
      stream: false,
    }),
    signal,
  })
  if (!res.ok) return null
  const data = (await res.json()) as { choices?: Array<{ text?: string }> }
  const raw = data.choices?.[0]?.text?.trim()
  if (!raw) return null
  return trimCompletionToMaxLines(stripPrefixEcho(raw, prefix), maxLines)
}

// ─── Ollama FIM ──────────────────────────────────────────────────────────────

async function fetchOllamaFim(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
  signal: AbortSignal,
): Promise<string | null> {
  const endpoint = config.endpoint?.trim() || 'http://localhost:11434/api/generate'
  const model = config.model?.trim() || 'codellama'

  // Ollama FIM 格式：<PRE> prefix <SUF> suffix <MID>
  const prompt = `<PRE> ${prefix} <SUF> ${suffix} <MID>`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: Math.min(256, maxLines * 60) },
    }),
    signal,
  })
  if (!res.ok) return null
  const data = (await res.json()) as { response?: string }
  const raw = data.response?.trim()
  if (!raw) return null
  return trimCompletionToMaxLines(raw, maxLines)
}

// ─── Qwen (通义千问) FIM ─────────────────────────────────────────────────────

const QWEN_FIM_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

async function fetchQwenFim(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
  signal: AbortSignal,
): Promise<string | null> {
  const model = config.model?.trim() || 'qwen-coder-turbo'

  const res = await fetch(QWEN_FIM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
      'X-DashScope-SSE': 'disable',
    },
    body: JSON.stringify({
      model,
      input: { prompt: prefix, suffix },
      parameters: {
        max_tokens: Math.min(256, maxLines * 60),
        temperature: 0.1,
      },
    }),
    signal,
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    output?: { text?: string }
    choices?: Array<{ message?: { content?: string } }>
  }
  const raw = (data.output?.text ?? data.choices?.[0]?.message?.content ?? '').trim()
  if (!raw) return null
  return trimCompletionToMaxLines(raw, maxLines)
}

// ─── 统一入口 ────────────────────────────────────────────────────────────────

/**
 * 调用对应 provider 的 FIM API。
 * 返回 null 时由 inlineCompletionService 回退到 chat-based 补全。
 */
export async function fetchFimCompletion(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
): Promise<string | null> {
  if (!supportsFimApi(config.provider)) return null
  if (!config.apiKey?.trim() && config.provider !== 'ollama') return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FIM_TIMEOUT_MS)

  try {
    switch (config.provider) {
      case 'deepseek':
        return await fetchDeepSeekFim(config, prefix, suffix, maxLines, controller.signal)
      case 'ollama':
        return await fetchOllamaFim(config, prefix, suffix, maxLines, controller.signal)
      case 'qwen':
        return await fetchQwenFim(config, prefix, suffix, maxLines, controller.signal)
      default:
        return null
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
