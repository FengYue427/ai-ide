import {
  GIT_DIFF_MAX_BYTES_PER_SIDE,
  GIT_DIFF_MAX_LINES_PER_SIDE,
} from './gitDiffContentLimits'

export type GitDiffRenderLayout = 'sideBySide' | 'inline'

/** Prefer inline diff above this line count (per side). */
export const GIT_DIFF_INLINE_LINE_THRESHOLD = 500

/** Prefer inline when either side exceeds this byte size. */
export const GIT_DIFF_INLINE_BYTE_THRESHOLD = 120_000

function countLines(text: string): number {
  if (!text) return 0
  return text.split('\n').length
}

/** Choose Monaco diff layout for performance (v1.1.6.5). */
export function resolveGitDiffRenderLayout(
  oldContent: string,
  newContent: string,
): GitDiffRenderLayout {
  const oldLines = countLines(oldContent)
  const newLines = countLines(newContent)

  if (oldLines > GIT_DIFF_INLINE_LINE_THRESHOLD || newLines > GIT_DIFF_INLINE_LINE_THRESHOLD) {
    return 'inline'
  }

  if (
    oldContent.length > GIT_DIFF_INLINE_BYTE_THRESHOLD ||
    newContent.length > GIT_DIFF_INLINE_BYTE_THRESHOLD
  ) {
    return 'inline'
  }

  if (
    oldLines > GIT_DIFF_MAX_LINES_PER_SIDE ||
    newLines > GIT_DIFF_MAX_LINES_PER_SIDE ||
    oldContent.length > GIT_DIFF_MAX_BYTES_PER_SIDE ||
    newContent.length > GIT_DIFF_MAX_BYTES_PER_SIDE
  ) {
    return 'inline'
  }

  return 'sideBySide'
}
