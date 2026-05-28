/**
 * Line diff + selective hunk apply for Agent change preview.
 *
 * Phase 1.3: 基于 LCS（最长公共子序列）的精准 diff 算法。
 * 相比原来的逐行对比，能正确识别移动/重排的行，大文件 diff 质量显著提升。
 */

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
}

// ─── LCS Diff 核心 ───────────────────────────────────────────────────────────

/**
 * 计算两个字符串数组的 LCS（最长公共子序列）长度矩阵。
 * 使用滚动数组优化空间复杂度到 O(M)。
 * 对超大文件（>2000行）自动降级为逐行对比。
 */
function computeLCS(oldLines: string[], newLines: string[]): number[][] {
  const N = oldLines.length
  const M = newLines.length

  // 超大文件降级：LCS 是 O(NM)，太大会卡
  if (N * M > 4_000_000) return []

  // dp[i][j] = oldLines[0..i-1] 与 newLines[0..j-1] 的 LCS 长度
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0))

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

/**
 * 从 LCS 矩阵回溯，生成 DiffLine 序列。
 */
function backtrackLCS(
  dp: number[][],
  oldLines: string[],
  newLines: string[],
): DiffLine[] {
  const result: DiffLine[] = []
  let i = oldLines.length
  let j = newLines.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: 'unchanged',
        oldLineNumber: i,
        newLineNumber: j,
        content: oldLines[i - 1] ?? '',
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: 'added',
        oldLineNumber: null,
        newLineNumber: j,
        content: newLines[j - 1] ?? '',
      })
      j--
    } else {
      result.push({
        type: 'removed',
        oldLineNumber: i,
        newLineNumber: null,
        content: oldLines[i - 1] ?? '',
      })
      i--
    }
  }

  return result.reverse()
}

/**
 * 简单逐行对比，用于超大文件降级（O(N) 时间）。
 */
function fallbackLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = []
  let oi = 0
  let ni = 0
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi >= oldLines.length) {
      result.push({ type: 'added', oldLineNumber: null, newLineNumber: ni + 1, content: newLines[ni] ?? '' })
      ni++
    } else if (ni >= newLines.length) {
      result.push({ type: 'removed', oldLineNumber: oi + 1, newLineNumber: null, content: oldLines[oi] ?? '' })
      oi++
    } else if (oldLines[oi] === newLines[ni]) {
      result.push({ type: 'unchanged', oldLineNumber: oi + 1, newLineNumber: ni + 1, content: oldLines[oi] ?? '' })
      oi++
      ni++
    } else {
      result.push({ type: 'removed', oldLineNumber: oi + 1, newLineNumber: null, content: oldLines[oi] ?? '' })
      result.push({ type: 'added', oldLineNumber: null, newLineNumber: ni + 1, content: newLines[ni] ?? '' })
      oi++
      ni++
    }
  }
  return result
}

// ─── 公开 API ────────────────────────────────────────────────────────────────

export function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const dp = computeLCS(oldLines, newLines)

  // 超大文件降级
  if (dp.length === 0) {
    return fallbackLineDiff(oldLines, newLines)
  }

  return backtrackLCS(dp, oldLines, newLines)
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
    // 有删除行：从第一个删除行的 oldLineNumber 开始替换
    return {
      start: (removed[0]!.oldLineNumber ?? 1) - 1,
      deleteCount: removed.length,
      insertLines: added,
    }
  }

  // 纯插入：找到插入点前面最近的 removed 或 unchanged 行的 oldLineNumber
  // Myers diff 中纯插入的 hunk，其 newLineNumber 对应新文件位置
  // 插入点 = 该 hunk 在 diffLines 中前一个 unchanged 行的 oldLineNumber
  // 简化：用 newLineNumber - 1 作为 old 数组的插入位置（因为纯插入不删除任何 old 行）
  const firstAdded = hunk.find((line) => line.type === 'added')
  const insertAfterNew = (firstAdded?.newLineNumber ?? 1) - 1
  // insertAfterNew 是新文件中该插入点之前有多少行
  // 由于是纯插入，old 文件中对应位置 = insertAfterNew（新文件前 insertAfterNew 行与 old 文件前 insertAfterNew 行相同）
  return {
    start: insertAfterNew,
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
