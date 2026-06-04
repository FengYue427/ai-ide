import { getMaxIndexFiles } from './indexLimits'
import type { IndexBuildStats } from './projectIndexService'

export type LargeRepoHintKind = 'capped' | 'near_cap'

export interface LargeRepoContextHint {
  kind: LargeRepoHintKind
  indexedFiles: number
  eligibleFiles: number
  maxFiles: number
}

export function getLargeRepoContextHint(stats: IndexBuildStats): LargeRepoContextHint | null {
  if (stats.eligibleFiles <= 0) return null

  const maxFiles = getMaxIndexFiles()
  if (stats.capped) {
    return {
      kind: 'capped',
      indexedFiles: stats.indexedFiles,
      eligibleFiles: stats.eligibleFiles,
      maxFiles,
    }
  }

  if (stats.eligibleFiles >= maxFiles * 0.85 && stats.indexedFiles < stats.eligibleFiles) {
    return {
      kind: 'near_cap',
      indexedFiles: stats.indexedFiles,
      eligibleFiles: stats.eligibleFiles,
      maxFiles,
    }
  }

  return null
}

export function shouldShowLargeRepoHint(
  hint: LargeRepoContextHint | null,
  options: { useWorkspaceContext: boolean; mentionTokenCount: number },
): boolean {
  if (!hint) return false
  return options.useWorkspaceContext || options.mentionTokenCount > 0
}
