/** v1.4.3 / v1.5 F1 — multi-line Tab++ ghost layout. */

export interface GhostLayoutInput {
  insertText: string
  lineNumber: number
  column: number
  /** Current line content (for indent alignment). */
  lineContent: string
}

export interface GhostInlineRange {
  insertText: string
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export function isMultilineGhostText(text: string): boolean {
  return text.replace(/\r\n/g, '\n').includes('\n')
}

/** Align continuation lines with the indent of the current line. */
export function alignGhostIndent(insertText: string, lineContent: string): string {
  const normalized = insertText.replace(/\r\n/g, '\n').trimEnd()
  if (!isMultilineGhostText(normalized)) return normalized

  const indentMatch = lineContent.match(/^(\s*)/)
  const indent = indentMatch?.[1] ?? ''
  const lines = normalized.split('\n')

  return lines
    .map((line, index) => {
      if (index === 0) return line
      if (line.length === 0) return line
      if (line.startsWith(indent) || line.startsWith('\t') || line.startsWith(' ')) return line
      return `${indent}${line}`
    })
    .join('\n')
}

export function buildGhostInlineRange(input: GhostLayoutInput): GhostInlineRange {
  const insertText = alignGhostIndent(input.insertText, input.lineContent)
  const lines = insertText.split('\n')

  if (lines.length <= 1) {
    return {
      insertText,
      startLineNumber: input.lineNumber,
      startColumn: input.column,
      endLineNumber: input.lineNumber,
      endColumn: input.column,
    }
  }

  const endLineNumber = input.lineNumber + lines.length - 1
  const lastLine = lines[lines.length - 1] ?? ''

  return {
    insertText,
    startLineNumber: input.lineNumber,
    startColumn: input.column,
    endLineNumber,
    endColumn: lastLine.length + 1,
  }
}
