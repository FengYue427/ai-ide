/** v1.5 F2 — partial ghost acceptance helpers. */

export interface PartialGhostState {
  fullText: string
  acceptedLength: number
}

export function createPartialGhostState(fullText: string): PartialGhostState {
  return { fullText, acceptedLength: 0 }
}

export function getRemainingGhostText(state: PartialGhostState): string {
  return state.fullText.slice(state.acceptedLength)
}

export function acceptNextWord(state: PartialGhostState): { accepted: string; done: boolean } {
  const remaining = getRemainingGhostText(state)
  if (!remaining) return { accepted: '', done: true }

  const match = remaining.match(/^(\s*\S+\s*)/)
  const chunk = match?.[1] ?? remaining.charAt(0)
  state.acceptedLength += chunk.length
  return { accepted: chunk, done: state.acceptedLength >= state.fullText.length }
}

export function acceptNextLine(state: PartialGhostState): { accepted: string; done: boolean } {
  const remaining = getRemainingGhostText(state)
  if (!remaining) return { accepted: '', done: true }

  const newlineIndex = remaining.indexOf('\n')
  const chunk = newlineIndex === -1 ? remaining : remaining.slice(0, newlineIndex + 1)
  state.acceptedLength += chunk.length
  return { accepted: chunk, done: state.acceptedLength >= state.fullText.length }
}

export function isPartialGhostComplete(state: PartialGhostState): boolean {
  return state.acceptedLength >= state.fullText.length
}
