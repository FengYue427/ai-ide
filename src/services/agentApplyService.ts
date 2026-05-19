/**
 * Parse Agent responses (### filename + fenced code) into apply-ready file changes.
 */

import { extractCodeBlocks } from './aiService'

export interface AgentFileChange {
  path: string
  content: string
  language: string
}

const HEADING_FILE = /^###\s+([\w./\-]+\.[\w]+)\s*$/m
const INLINE_FILE =
  /(?:^|\n)(?:文件|filename|file)[:\s]+`?([\w./\-]+\.[\w]+)`?/im

function inferLanguage(path: string, blockLang: string): string {
  if (blockLang && blockLang !== 'text') return blockLang
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    vue: 'vue',
  }
  return map[ext ?? ''] ?? 'plaintext'
}

function findFilenameBefore(content: string, blockStart: number): string | null {
  const before = content.slice(0, blockStart).split('\n').slice(-8).reverse()
  for (const line of before) {
    const heading = line.match(/###\s+([\w./\-]+\.[\w]+)/)
    if (heading) return heading[1]
    const inline = line.match(INLINE_FILE)
    if (inline) return inline[1]
    const backtick = line.match(/`([\w./\-]+\.[\w]+)`/)
    if (backtick) return backtick[1]
  }
  return null
}

export function parseAgentFileChanges(markdown: string): AgentFileChange[] {
  const blocks = extractCodeBlocks(markdown)
  const changes: AgentFileChange[] = []
  const usedPaths = new Set<string>()

  blocks.forEach((block, index) => {
    if (!block.code.trim()) return

    const marker = block.language ? `\`\`\`${block.language}` : '```'
    const blockStart = markdown.indexOf(marker)
    let path =
      findFilenameBefore(markdown, blockStart >= 0 ? blockStart : markdown.length) ??
      [...markdown.matchAll(HEADING_FILE)].map((m) => m[1])[index] ??
      null

    if (!path) {
      const ext =
        block.language === 'typescript'
          ? 'ts'
          : block.language === 'javascript'
            ? 'js'
            : block.language || 'txt'
      path = `generated-${index + 1}.${ext}`
    }

    path = path.replace(/^\.\//, '')
    if (usedPaths.has(path)) return
    usedPaths.add(path)

    changes.push({
      path,
      content: block.code,
      language: inferLanguage(path, block.language),
    })
  })

  return changes
}
