import type { AIConfig } from './aiService'

const DEEPSEEK_FIM_URL = 'https://api.deepseek.com/beta/completions'
const FIM_TIMEOUT_MS = 12_000

/** Providers with optional fill-in-the-middle HTTP API (v1.0.2.3). */
export function supportsFimApi(provider: AIConfig['provider']): boolean {
  return provider === 'deepseek'
}

export function trimCompletionToMaxLines(text: string, maxLines: number): string {
  const normalized = text.replace(/\r\n/g, '\n').trimEnd()
  if (maxLines < 1) return ''
  const lines = normalized.split('\n')
  if (lines.length <= maxLines) return normalized
  return lines.slice(0, maxLines).join('\n')
}

function resolveFimModel(config: AIConfig): string {
  const model = config.model?.trim()
  if (model && /coder/i.test(model)) return model
  return 'deepseek-coder'
}

/** DeepSeek beta completions (prefix + suffix). Returns null on failure → caller uses chat fallback. */
export async function fetchFimCompletion(
  config: AIConfig,
  prefix: string,
  suffix: string,
  maxLines: number,
): Promise<string | null> {
  if (!supportsFimApi(config.provider) || !config.apiKey?.trim()) {
    return null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FIM_TIMEOUT_MS)

  try {
    const res = await fetch(DEEPSEEK_FIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: resolveFimModel(config),
        prompt: prefix,
        suffix,
        max_tokens: Math.min(256, maxLines * 48),
        temperature: 0.1,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      choices?: Array<{ text?: string }>
    }
    const raw = data.choices?.[0]?.text?.trim()
    if (!raw) return null
    return trimCompletionToMaxLines(raw, maxLines)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
