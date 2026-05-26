/**
 * Line diff + selective hunk apply for Agent change preview.
 */

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
}

export function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const result: DiffLine[] = []

  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldIndex >= oldLines.length) {
      result.push({
        type: 'added',
        oldLineNumber: null,
        newLineNumber: newIndex + 1,
        content: newLine ?? '',
      })
      newIndex++
    } else if (newIndex >= newLines.length) {
      result.push({
        type: 'removed',
        oldLineNumber: oldIndex + 1,
        newLineNumber: null,
        content: oldLine ?? '',
      })
      oldIndex++
    } else if (oldLine === newLine) {
      result.push({
        type: 'unchanged',
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
        content: oldLine,
      })
      oldIndex++
      newIndex++
    } else {
      result.push({
        type: 'removed',
        oldLineNumber: oldIndex + 1,
        newLineNumber: null,
        content: oldLine,
      })
      result.push({
        type: 'added',
        oldLineNumber: null,
        newLineNumber: newIndex + 1,
        content: newLine,
      })
      oldIndex++
      newIndex++
    }
  }

  return result
}

/** Group consecutive added/removed lines into hunks for partial accept. */
export function groupDiffHunks(diffLines: DiffLine[]): DiffLine[][] {
  const hunks: DiffLine[][] = []
  let current: DiffLine[] = []

  for (const line of diffLines) {
    if (line.type === 'unchanged') {
      if (current.length > 0) {
        hunks.push(current)
        current = []
      }
      continue
    }
    current.push(line)
  }

  if (current.length > 0) {
    hunks.push(current)
  }

  return hunks
}

function hunkEditRange(hunk: DiffLine[]): { start: number; deleteCount: number; insertLines: string[] } {
  const removed = hunk.filter((line) => line.type === 'removed')
  const added = hunk.filter((line) => line.type === 'added').map((line) => line.content)

  if (removed.length > 0) {
    return {
      start: (removed[0]!.oldLineNumber ?? 1) - 1,
      deleteCount: removed.length,
      insertLines: added,
    }
  }

  const firstAdded = hunk.find((line) => line.type === 'added')
  return {
    start: (firstAdded?.newLineNumber ?? 1) - 1,
    deleteCount: 0,
    insertLines: added,
  }
}

/** Apply only accepted hunks onto old content; rejected hunks keep the original lines. */
export function applyPartialDiff(
  oldContent: string,
  diffLines: DiffLine[],
  acceptedHunkIndices: Set<number>,
): string {
  const hunks = groupDiffHunks(diffLines)
  const lines = oldContent.split('\n')

  const edits = hunks
    .map((hunk, index) => ({ hunk, index }))
    .filter((entry) => acceptedHunkIndices.has(entry.index))
    .map((entry) => ({ index: entry.index, ...hunkEditRange(entry.hunk) }))
    .sort((a, b) => b.start - a.start)

  for (const edit of edits) {
    lines.splice(edit.start, edit.deleteCount, ...edit.insertLines)
  }

  return lines.join('\n')
}

export function defaultAcceptedHunks(diffLines: DiffLine[]): Set<number> {
  const hunks = groupDiffHunks(diffLines)
  return new Set(hunks.map((_, index) => index))
}

export function countDiffHunks(oldContent: string, newContent: string): number {
  return groupDiffHunks(computeLineDiff(oldContent, newContent)).length
}

/** Merge old→new using hunk selection; new files return newContent as-is. */
export function mergeAgentFileContent(
  oldContent: string,
  newContent: string,
  acceptedHunkIndices: Set<number>,
): string {
  if (!oldContent) return newContent
  const diffLines = computeLineDiff(oldContent, newContent)
  const total = groupDiffHunks(diffLines).length
  if (total === 0) return newContent
  if (acceptedHunkIndices.size >= total) return newContent
  return applyPartialDiff(oldContent, diffLines, acceptedHunkIndices)
}
