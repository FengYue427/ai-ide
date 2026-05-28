/**
 * Optional BYOK semantic retrieval: chunk workspace files and rank by embedding similarity.
 */

import type { Language } from '../i18n'
import { isSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { serviceText } from '../lib/serviceI18n'
import type { AIConfig } from './aiService'
import { canUseEmbeddings, cosineSimilarity, createEmbedding } from './embeddingService'
import { collectIndexSources } from './projectIndexService'

export interface SemanticChunkHit {
  path: string
  text: string
  score: number
}

const CHUNK_SIZE = 480
const CHUNK_OVERLAP = 80
const MAX_CHUNKS_PER_FILE = 12
const MAX_FILES = 24

interface ChunkRecord {
  path: string
  text: string
  vector: number[]
}

const chunkVectorCache = new Map<string, ChunkRecord[]>()

function cacheKey(path: string, content: string): string {
  return `${path}:${content.length}:${content.slice(0, 64)}`
}

function splitIntoChunks(content: string): string[] {
  if (content.length <= CHUNK_SIZE) return [content]

  const chunks: string[] = []
  let start = 0

  while (start < content.length && chunks.length < MAX_CHUNKS_PER_FILE) {
    const end = Math.min(content.length, start + CHUNK_SIZE)
    chunks.push(content.slice(start, end))
    if (end >= content.length) break
    start = Math.max(start + 1, end - CHUNK_OVERLAP)
  }

  return chunks
}

async function embedChunks(
  path: string,
  content: string,
  config: AIConfig,
): Promise<ChunkRecord[]> {
  const key = cacheKey(path, content)
  const cached = chunkVectorCache.get(key)
  if (cached) return cached

  const chunks = splitIntoChunks(content)
  const records: ChunkRecord[] = []

  for (const text of chunks) {
    const trimmed = text.trim()
    if (!trimmed) continue
    const vector = await createEmbedding(trimmed, config)
    records.push({ path, text: trimmed, vector })
  }

  chunkVectorCache.set(key, records)
  return records
}

export async function findRelevantChunks(
  query: string,
  files: { path: string; content: string }[],
  config: AIConfig,
  options?: { topK?: number; maxFiles?: number; candidatePaths?: string[] },
): Promise<SemanticChunkHit[]> {
  if (!canUseEmbeddings(config) || !query.trim()) return []

  const topK = options?.topK ?? 5
  const maxFiles = options?.maxFiles ?? MAX_FILES
  const queryVector = await createEmbedding(query, config)

  const candidatePathSet = options?.candidatePaths?.length ? new Set(options.candidatePaths) : null
  const candidates = collectIndexSources(
    files.map((file) => ({ name: file.path, content: file.content })),
  )
    .filter((file) => file.content.trim().length > 0)
    .filter((file) => (candidatePathSet ? candidatePathSet.has(file.path) : true))
    .slice(0, maxFiles)
    .map((file) => ({ path: file.path, content: file.content }))

  const hits: SemanticChunkHit[] = []

  for (const file of candidates) {
    const records = await embedChunks(file.path, file.content, config)
    for (const record of records) {
      hits.push({
        path: record.path,
        text: record.text,
        score: cosineSimilarity(queryVector, record.vector),
      })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, topK)
}

export function formatSemanticContextSection(
  hits: SemanticChunkHit[],
  locale: Language = 'zh-CN',
): string {
  if (hits.length === 0) return ''

  const lines = hits.map((hit, index) =>
    serviceText(
      'semantic.hitLine',
      {
        index: index + 1,
        path: hit.path,
        score: (hit.score * 100).toFixed(0),
        text: hit.text,
      },
      locale,
    ),
  )

  return `\n\n## ${serviceText('semantic.section.title', undefined, locale)}\n${lines.join('\n\n')}`
}

export async function buildSemanticContextSection(
  query: string,
  files: { path: string; content: string }[],
  config: AIConfig,
  locale: Language = 'zh-CN',
  options?: { candidatePaths?: string[] },
): Promise<string> {
  if (!isSemanticSearchEnabled()) return ''

  try {
    const hits = await findRelevantChunks(query, files, config, { candidatePaths: options?.candidatePaths })
    return formatSemanticContextSection(hits, locale)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : serviceText('semantic.error.generic', undefined, locale)
    console.warn('[semanticSearch]', message)
    return ''
  }
}

/** Clear in-memory embedding cache (e.g. after large workspace replace). */
export function clearSemanticSearchCache(): void {
  chunkVectorCache.clear()
}
