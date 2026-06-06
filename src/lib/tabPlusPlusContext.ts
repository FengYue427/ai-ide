/** v1.5 F2 — Tab++ context assembly (open files + runtime snapshot). */

import { buildRuntimeContextSnapshot } from '../services/runtime/runtimeContextSnapshot'

export interface TabPlusPlusContextInput {
  prefix: string
  suffix: string
  middle?: string
  filename: string
  openFiles: Array<{ name: string; content: string }>
  activeSpecPath: string | null
}

export interface TabPlusPlusContext {
  prefix: string
  suffix: string
  middle?: string
  relatedFileSnippets: Array<{ path: string; head: string }>
  activeSpecTaskLine?: string
  contextFingerprint: string
}

const HEAD_CHARS = 400
const MAX_RELATED_FILES = 3

function headSnippet(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n')
  if (normalized.length <= HEAD_CHARS) return normalized
  return `${normalized.slice(0, HEAD_CHARS)}\n…`
}

export function buildTabPlusPlusContext(input: TabPlusPlusContextInput): TabPlusPlusContext {
  const snapshot = buildRuntimeContextSnapshot(input.openFiles, input.activeSpecPath)
  const relatedFileSnippets = input.openFiles
    .filter((file) => file.name !== input.filename && file.name !== input.activeSpecPath)
    .slice(0, MAX_RELATED_FILES)
    .map((file) => ({ path: file.name, head: headSnippet(file.content) }))

  const contextFingerprint = [
    input.filename,
    snapshot.activeSpecPath ?? '',
    snapshot.firstOpenTaskText ?? '',
    relatedFileSnippets.map((file) => file.path).join('|'),
  ].join(':')

  return {
    prefix: input.prefix,
    suffix: input.suffix,
    middle: input.middle,
    relatedFileSnippets,
    activeSpecTaskLine: snapshot.firstOpenTaskText ?? undefined,
    contextFingerprint,
  }
}

export function appendTabPlusPlusContextToPrompt(basePrompt: string, context: TabPlusPlusContext): string {
  const sections: string[] = [basePrompt]

  if (context.activeSpecTaskLine) {
    sections.push(`Active spec task:\n${context.activeSpecTaskLine}`)
  }

  if (context.relatedFileSnippets.length > 0) {
    const related = context.relatedFileSnippets
      .map((file) => `File: ${file.path}\n${file.head}`)
      .join('\n\n')
    sections.push(`Related open files:\n${related}`)
  }

  return sections.join('\n\n')
}

export function extendTabCompletionCacheKey(baseKey: string, context: TabPlusPlusContext): string {
  return `${baseKey}:ctx:${context.contextFingerprint}`
}
