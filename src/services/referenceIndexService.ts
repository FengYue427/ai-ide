export interface ReferenceLocation {
  path: string
  line: number
  column: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Find word-boundary references to a symbol across project files. */
export function findReferencesInFiles(
  files: { name: string; content: string }[],
  symbolName: string,
  maxResults = 80,
): ReferenceLocation[] {
  if (!symbolName.trim()) return []

  const pattern = new RegExp(`\\b${escapeRegExp(symbolName)}\\b`, 'g')
  const results: ReferenceLocation[] = []

  for (const file of files) {
    const lines = file.content.split(/\r?\n/)
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(line)) !== null) {
        results.push({
          path: file.name,
          line: lineIndex + 1,
          column: match.index + 1,
        })
        if (results.length >= maxResults) return results
      }
    }
  }

  return results
}
