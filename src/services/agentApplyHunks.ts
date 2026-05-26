import type { AgentApplyItem } from '../store/ideStore'
import {
  computeLineDiff,
  countDiffHunks,
  defaultAcceptedHunks,
  mergeAgentFileContent,
} from './diffHunkService'

export type HunkSelectionMap = Map<string, Set<number>>

export function initHunkSelections(items: AgentApplyItem[]): HunkSelectionMap {
  const map: HunkSelectionMap = new Map()
  for (const item of items) {
    if (!item.oldContent) continue
    const diffLines = computeLineDiff(item.oldContent, item.newContent)
    map.set(item.path, defaultAcceptedHunks(diffLines))
  }
  return map
}

export function getHunkCountForItem(item: AgentApplyItem): number {
  if (!item.oldContent) return 0
  return countDiffHunks(item.oldContent, item.newContent)
}

export function resolveApplyContent(item: AgentApplyItem, selections: HunkSelectionMap): string {
  if (!item.oldContent) return item.newContent
  const accepted = selections.get(item.path) ?? defaultAcceptedHunks(
    computeLineDiff(item.oldContent, item.newContent),
  )
  return mergeAgentFileContent(item.oldContent, item.newContent, accepted)
}

export function acceptedHunkSummary(item: AgentApplyItem, selections: HunkSelectionMap): {
  total: number
  accepted: number
} {
  const total = getHunkCountForItem(item)
  if (total === 0) return { total: 0, accepted: 0 }
  const accepted = selections.get(item.path)?.size ?? total
  return { total, accepted }
}
