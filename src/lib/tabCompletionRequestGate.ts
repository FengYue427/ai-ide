/** Minimum non-whitespace chars on the current line before Tab completion fires (v1.3.2). */
export const MIN_TAB_PREFIX_CHARS = 3

export function shouldSkipTabCompletionRequest(prefix: string): boolean {
  if (!prefix || prefix.trim().length === 0) return true
  const lastLine = prefix.split('\n').pop() ?? ''
  const significant = lastLine.trim()
  return significant.length < MIN_TAB_PREFIX_CHARS
}
