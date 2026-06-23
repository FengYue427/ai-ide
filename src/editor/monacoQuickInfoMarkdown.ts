type TsSymbolDisplayPart = { text: string; kind: string }
type TsQuickInfoTag = { name: string; text?: TsSymbolDisplayPart[] }

export type TsQuickInfo = {
  kind: string
  kindModifiers?: string
  textSpan: { start: number; length: number }
  displayParts?: TsSymbolDisplayPart[]
  documentation?: TsSymbolDisplayPart[]
  tags?: TsQuickInfoTag[]
}

function displayPartsToString(parts: TsSymbolDisplayPart[] | undefined): string {
  return parts?.map((part) => part.text).join('') ?? ''
}

export function formatQuickInfoMarkdown(info: TsQuickInfo): string {
  const signature = displayPartsToString(info.displayParts)
  const docs = displayPartsToString(info.documentation)
  const chunks: string[] = []

  if (signature) {
    chunks.push(`\`\`\`typescript\n${signature}\n\`\`\``)
  }
  if (docs.trim()) {
    chunks.push(docs.trim())
  }
  for (const tag of info.tags ?? []) {
    if (tag.name === 'deprecated') {
      chunks.push('*Deprecated*')
      continue
    }
    const tagText = displayPartsToString(tag.text)
    if (tagText.trim()) {
      chunks.push(`**@${tag.name}** ${tagText.trim()}`)
    }
  }

  return chunks.join('\n\n')
}
