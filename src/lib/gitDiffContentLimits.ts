/** Caps for inline Monaco git diff tabs (v1.1.6.1). */

export const GIT_DIFF_MAX_LINES_PER_SIDE = 2000
export const GIT_DIFF_MAX_BYTES_PER_SIDE = 512_000

export interface GitDiffSideLimitResult {
  content: string
  truncated: boolean
  totalLines: number
  shownLines: number
}

export interface PreparedGitDiffContent {
  oldContent: string
  newContent: string
  truncated: boolean
  originalOldLines: number
  originalNewLines: number
  shownOldLines: number
  shownNewLines: number
}

function countLines(text: string): number {
  if (!text) return 0
  return text.split('\n').length
}

/** Truncate one diff side for Monaco when lines or bytes exceed caps. */
export function truncateGitDiffSide(
  content: string,
  maxLines: number = GIT_DIFF_MAX_LINES_PER_SIDE,
  maxBytes: number = GIT_DIFF_MAX_BYTES_PER_SIDE,
): GitDiffSideLimitResult {
  const totalLines = countLines(content)
  if (!content) {
    return { content: '', truncated: false, totalLines: 0, shownLines: 0 }
  }

  const overBytes = content.length > maxBytes
  const overLines = totalLines > maxLines
  if (!overBytes && !overLines) {
    return { content, truncated: false, totalLines, shownLines: totalLines }
  }

  let truncated = content
  if (overBytes) {
    truncated = truncated.slice(0, maxBytes)
    const lastNewline = truncated.lastIndexOf('\n')
    if (lastNewline > 0) {
      truncated = truncated.slice(0, lastNewline)
    }
  }

  const lines = truncated.split('\n')
  if (lines.length > maxLines) {
    truncated = lines.slice(0, maxLines).join('\n')
  }

  const shownLines = countLines(truncated)
  return {
    content: truncated,
    truncated: true,
    totalLines,
    shownLines,
  }
}

/** Prepare old/new blob text before opening a git diff tab. */
export function prepareGitDiffForEditor(
  oldContent: string,
  newContent: string,
): PreparedGitDiffContent {
  const oldSide = truncateGitDiffSide(oldContent)
  const newSide = truncateGitDiffSide(newContent)
  const truncated = oldSide.truncated || newSide.truncated

  return {
    oldContent: oldSide.content,
    newContent: newSide.content,
    truncated,
    originalOldLines: oldSide.totalLines,
    originalNewLines: newSide.totalLines,
    shownOldLines: oldSide.shownLines,
    shownNewLines: newSide.shownLines,
  }
}

export function shouldTruncateGitDiff(oldContent: string, newContent: string): boolean {
  return (
    oldContent.length > GIT_DIFF_MAX_BYTES_PER_SIDE ||
    newContent.length > GIT_DIFF_MAX_BYTES_PER_SIDE ||
    countLines(oldContent) > GIT_DIFF_MAX_LINES_PER_SIDE ||
    countLines(newContent) > GIT_DIFF_MAX_LINES_PER_SIDE
  )
}
