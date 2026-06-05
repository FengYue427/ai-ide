/** v1.4.6 — FIM fill-in-middle context split. */

export interface FimEditorSelection {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export interface FimContextParts {
  prefix: string
  suffix: string
  middle?: string
}

export function isEmptySelection(selection: FimEditorSelection): boolean {
  return (
    selection.startLineNumber === selection.endLineNumber &&
    selection.startColumn === selection.endColumn
  )
}

export function buildFimContextFromSelection(
  fullText: string,
  selection: FimEditorSelection | null | undefined,
  cursor: { lineNumber: number; column: number },
): FimContextParts {
  if (!selection || isEmptySelection(selection)) {
    const lines = fullText.replace(/\r\n/g, '\n').split('\n')
    const prefix = sliceTextBeforeCursor(lines, cursor.lineNumber, cursor.column)
    const suffix = sliceTextAfterCursor(lines, cursor.lineNumber, cursor.column)
    return { prefix, suffix }
  }

  const lines = fullText.replace(/\r\n/g, '\n').split('\n')
  const prefix = sliceTextBeforePosition(lines, selection.startLineNumber, selection.startColumn)
  const middle = sliceRange(lines, selection)
  const suffix = sliceTextAfterPosition(lines, selection.endLineNumber, selection.endColumn)
  return { prefix, suffix, middle: middle.length > 0 ? middle : undefined }
}

function sliceTextBeforeCursor(lines: string[], line: number, column: number): string {
  return sliceTextBeforePosition(lines, line, column)
}

function sliceTextAfterCursor(lines: string[], line: number, column: number): string {
  return sliceTextAfterPosition(lines, line, column)
}

function sliceTextBeforePosition(lines: string[], line: number, column: number): string {
  const parts: string[] = []
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    parts.push(lines[i] ?? '')
  }
  if (line >= 1 && line <= lines.length) {
    const current = lines[line - 1] ?? ''
    parts.push(current.slice(0, Math.max(0, column - 1)))
  }
  return parts.join('\n')
}

function sliceTextAfterPosition(lines: string[], line: number, column: number): string {
  const parts: string[] = []
  if (line >= 1 && line <= lines.length) {
    const current = lines[line - 1] ?? ''
    parts.push(current.slice(Math.max(0, column - 1)))
  }
  for (let i = line; i < lines.length; i++) {
    parts.push(lines[i] ?? '')
  }
  return parts.join('\n')
}

function sliceRange(lines: string[], selection: FimEditorSelection): string {
  const { startLineNumber, startColumn, endLineNumber, endColumn } = selection
  if (startLineNumber === endLineNumber) {
    const line = lines[startLineNumber - 1] ?? ''
    return line.slice(startColumn - 1, endColumn - 1)
  }

  const parts: string[] = []
  for (let line = startLineNumber; line <= endLineNumber; line++) {
    const text = lines[line - 1] ?? ''
    if (line === startLineNumber) parts.push(text.slice(startColumn - 1))
    else if (line === endLineNumber) parts.push(text.slice(0, endColumn - 1))
    else parts.push(text)
  }
  return parts.join('\n')
}

export function buildChatFimPromptWithMiddle(
  language: string,
  filename: string,
  prefix: string,
  suffix: string,
  middle: string | undefined,
  maxLines: number,
): string {
  const middleBlock = middle?.trim()
    ? `\nSelected / middle region to replace:\n\`\`\`\n${middle}\n\`\`\`\n`
    : ''

  return `Continue the ${language} code in file "${filename}".
Return ONLY the next ${maxLines} line(s) to insert at the cursor (fewer is OK).
No markdown fences, no explanation, no repetition of lines already in the prefix.
${middleBlock}
Code before cursor:
\`\`\`
${prefix}
\`\`\`

Code after cursor:
\`\`\`
${suffix}
\`\`\``
}
