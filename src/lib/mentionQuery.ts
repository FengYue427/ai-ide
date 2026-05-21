/** Returns the @-mention query before the cursor, or null if not in a mention. */
export function getActiveMentionQuery(text: string, cursor: number): string | null {
  const head = text.slice(0, cursor)
  const match = head.match(/@([\w./#:-]*)$/)
  return match ? match[1] : null
}

/** Insert mention label at the active @-query position. */
export function insertMention(
  text: string,
  cursor: number,
  mentionLabel: string,
): { text: string; cursor: number } {
  const head = text.slice(0, cursor)
  const tail = text.slice(cursor)
  const match = head.match(/@([\w./#:-]*)$/)
  if (!match) return { text, cursor }

  const before = head.slice(0, head.length - match[0].length)
  const inserted = `@${mentionLabel} `
  const nextText = `${before}${inserted}${tail}`
  const nextCursor = before.length + inserted.length
  return { text: nextText, cursor: nextCursor }
}
