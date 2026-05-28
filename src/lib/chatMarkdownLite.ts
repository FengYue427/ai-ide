/**
 * Lightweight markdown subset for chat bubbles (no full MD engine).
 */

export type InlineNode =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'em'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; label: string; href: string }

export type MarkdownBlock =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'blockquote'; lines: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }

const TABLE_ROW_RE = /^\|.+\|$/
const UL_RE = /^[-*]\s+(.+)$/
const OL_RE = /^\d+\.\s+(.+)$/
const QUOTE_RE = /^>\s?(.*)$/
const HEADING_RE = /^(#{1,6})\s+(.+)$/

function isTableSeparator(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim())
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function parseInlineMarkdown(line: string): InlineNode[] {
  const nodes: InlineNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      nodes.push({ kind: 'text', value: line.slice(last, match.index) })
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push({ kind: 'strong', value: token.slice(2, -2) })
    } else if (token.startsWith('*')) {
      nodes.push({ kind: 'em', value: token.slice(1, -1) })
    } else if (token.startsWith('`')) {
      nodes.push({ kind: 'code', value: token.slice(1, -1) })
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push({ kind: 'link', label: linkMatch[1], href: linkMatch[2] })
      } else {
        nodes.push({ kind: 'text', value: token })
      }
    }
    last = match.index + token.length
  }

  if (last < line.length) {
    nodes.push({ kind: 'text', value: line.slice(last) })
  }

  if (nodes.length === 0) {
    nodes.push({ kind: 'text', value: line })
  }

  return nodes
}

export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.split('\n')
  const blocks: MarkdownBlock[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (buf.length > 0) {
      blocks.push({ kind: 'paragraph', lines: [...buf] })
      buf.length = 0
    }
  }

  const paraBuf: string[] = []

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph(paraBuf)
      i += 1
      continue
    }

    const heading = trimmed.match(HEADING_RE)
    if (heading) {
      flushParagraph(paraBuf)
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] })
      i += 1
      continue
    }

    if (TABLE_ROW_RE.test(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushParagraph(paraBuf)
      const headers = splitTableRow(trimmed)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && TABLE_ROW_RE.test(lines[i].trim())) {
        rows.push(splitTableRow(lines[i]))
        i += 1
      }
      blocks.push({ kind: 'table', headers, rows })
      continue
    }

    const quote = trimmed.match(QUOTE_RE)
    if (quote) {
      flushParagraph(paraBuf)
      const quoteLines: string[] = []
      while (i < lines.length) {
        const q = lines[i].trim().match(QUOTE_RE)
        if (!q) break
        quoteLines.push(q[1])
        i += 1
      }
      blocks.push({ kind: 'blockquote', lines: quoteLines })
      continue
    }

    const ul = trimmed.match(UL_RE)
    if (ul) {
      flushParagraph(paraBuf)
      const items: string[] = []
      while (i < lines.length) {
        const m = lines[i].trim().match(UL_RE)
        if (!m) break
        items.push(m[1])
        i += 1
      }
      blocks.push({ kind: 'ul', items })
      continue
    }

    const ol = trimmed.match(OL_RE)
    if (ol) {
      flushParagraph(paraBuf)
      const items: string[] = []
      while (i < lines.length) {
        const m = lines[i].trim().match(OL_RE)
        if (!m) break
        items.push(m[1])
        i += 1
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    paraBuf.push(line)
    i += 1
  }

  flushParagraph(paraBuf)
  return blocks
}

export type CodeSegment = { language: string; value: string }

export function splitMessageSegments(content: string): Array<{ kind: 'text'; value: string } | { kind: 'code' } & CodeSegment> {
  const segments: Array<{ kind: 'text'; value: string } | ({ kind: 'code' } & CodeSegment)> = []
  const re = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: content.slice(lastIndex, match.index) })
    }
    segments.push({
      kind: 'code',
      language: match[1] || 'text',
      value: match[2].trimEnd(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: 'text', value: content.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ kind: 'text', value: content })
  }

  return segments
}
