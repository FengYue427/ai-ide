/**
 * Resolve @mentions in Chat input into extra system-prompt context.
 */

import { summarizeFileContent } from './workspacePromptUtils'
import type { IndexedSymbol, ProjectIndex } from './projectIndexService'
import { workspaceContextService } from './workspaceContextService'

export const MENTION_TOKEN_PATTERN = /@([\w./#:-]+)/g

const MAX_MENTIONS = 6
const MAX_SECTION_CHARS = 12_000
const MAX_FILE_CHARS = 4_000

export interface MentionResolution {
  token: string
  path: string
  symbol?: IndexedSymbol
  content: string
}

export function extractMentionTokens(text: string): string[] {
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const match of text.matchAll(MENTION_TOKEN_PATTERN)) {
    const token = match[1]?.trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }
  return tokens
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function findFilePath(token: string, paths: string[]): string | null {
  const normalized = normalizePath(token)
  if (paths.includes(normalized)) return normalized
  const suffix = `/${normalized}`
  const endsWith = paths.filter((path) => path.endsWith(suffix) || path === normalized)
  if (endsWith.length === 1) return endsWith[0]
  const basename = normalized.split('/').pop() ?? normalized
  const byBase = paths.filter((path) => path.split('/').pop() === basename)
  if (byBase.length === 1) return byBase[0]
  return null
}

function parseSymbolToken(token: string): { path: string; name: string } | null {
  const hash = token.indexOf('#')
  if (hash <= 0) return null
  return {
    path: normalizePath(token.slice(0, hash)),
    name: token.slice(hash + 1),
  }
}

function getFileContent(
  path: string,
  editorFiles: { name: string; content: string }[],
): string | null {
  const editor = editorFiles.find((file) => normalizePath(file.name) === path)
  if (editor) return editor.content

  const workspace = workspaceContextService.getAllFiles().find((file) => file.path === path)
  return workspace?.content ?? null
}

export function resolveMentionToken(
  token: string,
  editorFiles: { name: string; content: string }[],
  index: ProjectIndex,
): MentionResolution | null {
  const paths = index.files.map((file) => file.path)
  const symbolRef = parseSymbolToken(token)

  if (symbolRef) {
    const path = findFilePath(symbolRef.path, paths) ?? symbolRef.path
    const indexed = index.files.find((file) => file.path === path)
    const symbol = indexed?.symbols.find((item) => item.name === symbolRef.name)
    const content = getFileContent(path, editorFiles)
    if (!content) return null
    return { token, path, symbol, content }
  }

  if (token.includes('/') || token.includes('.')) {
    const path = findFilePath(token, paths)
    if (!path) return null
    const content = getFileContent(path, editorFiles)
    if (!content) return null
    return { token, path, content }
  }

  const symbolHits: { symbol: IndexedSymbol; path: string }[] = []
  for (const file of index.files) {
    for (const symbol of file.symbols) {
      if (symbol.name === token) {
        symbolHits.push({ symbol, path: file.path })
      }
    }
  }

  if (symbolHits.length >= 1) {
    const pick = symbolHits[0]
    const content = getFileContent(pick.path, editorFiles)
    if (!content) return null
    return { token, path: pick.path, symbol: pick.symbol, content }
  }

  const path = findFilePath(token, paths)
  if (!path) return null
  const content = getFileContent(path, editorFiles)
  if (!content) return null
  return { token, path, content }
}

export function buildMentionContextSection(
  userText: string,
  editorFiles: { name: string; content: string }[],
  index: ProjectIndex,
): string {
  const tokens = extractMentionTokens(userText).slice(0, MAX_MENTIONS)
  if (tokens.length === 0) return ''

  const blocks: string[] = []
  let totalChars = 0

  for (const token of tokens) {
    const resolved = resolveMentionToken(token, editorFiles, index)
    if (!resolved) continue

    const lang = resolved.path.split('.').pop() ?? 'text'
    const header = resolved.symbol
      ? `### @${token} → \`${resolved.path}\` 符号 \`${resolved.symbol.name}\`（约第 ${resolved.symbol.line} 行）`
      : `### @${token} → \`${resolved.path}\``

    let body = resolved.content
    if (body.length > MAX_FILE_CHARS) {
      body = summarizeFileContent(body, 40)
    }

    const block = `${header}\n\`\`\`${lang}\n${body}\n\`\`\``
    if (totalChars + block.length > MAX_SECTION_CHARS) {
      blocks.push('（更多 @ 提及因长度限制未展开，请缩小提及范围或关闭部分工作区文件。）')
      break
    }
    blocks.push(block)
    totalChars += block.length
  }

  if (blocks.length === 0) return ''

  return `## 用户 @ 提及的代码上下文\n\n用户在消息中用 @ 引用了以下文件/符号，请优先结合这些内容回答：\n\n${blocks.join('\n\n')}`
}
