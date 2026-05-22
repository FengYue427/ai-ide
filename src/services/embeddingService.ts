import { serviceText } from '../lib/serviceI18n'
import type { AIConfig } from './aiService'

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'

const embeddingsBaseUrl: Partial<Record<AIConfig['provider'], string>> = {
  openai: 'https://api.openai.com/v1/embeddings',
  deepseek: 'https://api.deepseek.com/v1/embeddings',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
  claude: 'https://api.openai.com/v1/embeddings',
  minimax: 'https://api.minimax.chat/v1/embeddings',
  grok: 'https://api.x.ai/v1/embeddings',
}

export function canUseEmbeddings(config: AIConfig): boolean {
  return Boolean(config.apiKey?.trim()) && config.provider !== 'ollama'
}

function resolveEmbeddingsUrl(config: AIConfig): string {
  if (config.endpoint?.trim()) {
    return config.endpoint.replace(/\/chat\/completions\/?$/i, '/embeddings')
  }
  return embeddingsBaseUrl[config.provider] ?? embeddingsBaseUrl.openai!
}

export async function createEmbedding(text: string, config: AIConfig): Promise<number[]> {
  if (!canUseEmbeddings(config)) {
    throw new Error(serviceText('embedding.apiKeyRequired'))
  }

  const response = await fetch(resolveEmbeddingsUrl(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Embedding API ${response.status}: ${detail.slice(0, 200)}`)
  }

  const payload = (await response.json()) as {
    data?: { embedding?: number[] }[]
  }

  const vector = payload.data?.[0]?.embedding
  if (!vector?.length) {
    throw new Error(serviceText('embedding.emptyResponse'))
  }

  return vector
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length)
  if (length === 0) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let index = 0; index < length; index++) {
    dot += a[index]! * b[index]!
    normA += a[index]! * a[index]!
    normB += b[index]! * b[index]!
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
