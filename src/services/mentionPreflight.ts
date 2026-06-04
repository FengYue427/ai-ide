import {
  extractMentionTokens,
  resolveMentionToken,
  type MentionResolution,
} from './mentionContextService'
import type { ProjectIndex } from './projectIndexService'

export const MENTION_PREFLIGHT_MAX = 6

export type MentionPreflightIssue =
  | { kind: 'too_many'; count: number; max: number }
  | { kind: 'unresolved'; token: string }
  | { kind: 'ambiguous'; token: string; paths: string[] }

export interface MentionPreflightResult {
  tokens: string[]
  issues: MentionPreflightIssue[]
  resolved: MentionResolution[]
}

function ambiguousSymbolPaths(token: string, index: ProjectIndex): string[] {
  if (token.includes('/') || token.includes('.') || token.includes('#')) return []

  const paths = new Set<string>()
  for (const file of index.files) {
    for (const symbol of file.symbols) {
      if (symbol.name === token) paths.add(file.path)
    }
  }
  return [...paths]
}

export function runMentionPreflight(
  text: string,
  editorFiles: { name: string; content: string }[],
  index: ProjectIndex,
): MentionPreflightResult {
  const tokens = extractMentionTokens(text)
  const issues: MentionPreflightIssue[] = []
  const resolved: MentionResolution[] = []

  if (tokens.length > MENTION_PREFLIGHT_MAX) {
    issues.push({ kind: 'too_many', count: tokens.length, max: MENTION_PREFLIGHT_MAX })
  }

  for (const token of tokens) {
    const paths = ambiguousSymbolPaths(token, index)
    if (paths.length > 1) {
      issues.push({ kind: 'ambiguous', token, paths: paths.slice(0, 4) })
    }

    const hit = resolveMentionToken(token, editorFiles, index)
    if (hit) {
      resolved.push(hit)
    } else {
      issues.push({ kind: 'unresolved', token })
    }
  }

  return { tokens, issues, resolved }
}

export function countUnresolvedMentions(result: MentionPreflightResult): number {
  return result.issues.filter((issue) => issue.kind === 'unresolved').length
}
