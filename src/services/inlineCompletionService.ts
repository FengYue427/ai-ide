import { sendMessageWithDebounce, type AIConfig } from './aiService'

const MAX_PREFIX_CHARS = 1200
const MAX_SUFFIX_CHARS = 400

export interface InlineCompletionRequest {
  prefix: string
  suffix: string
  language: string
  filename: string
  config: AIConfig
}

function trimContext(text: string, maxLen: number, fromEnd: boolean): string {
  if (text.length <= maxLen) return text
  return fromEnd ? text.slice(-maxLen) : text.slice(0, maxLen)
}

export const inlineCompletionService = {
  async fetchCompletion(request: InlineCompletionRequest): Promise<string | null> {
    if (!request.config.apiKey?.trim() && request.config.provider !== 'ollama') {
      return null
    }

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
        { debounceMs: 600, skipDebounce: false },
      )
    } catch {
      return null
    }

    const cleaned = raw
      .replace(/^```[\w]*\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()

    return cleaned.length > 0 ? cleaned : null
  },
}
