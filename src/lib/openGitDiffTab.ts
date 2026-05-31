import type { GitDiffTab } from '../types/editorTab'
import { prepareGitDiffForEditor } from './gitDiffContentLimits'
import { resolveGitDiffRenderLayout, type GitDiffRenderLayout } from './gitDiffLayout'

export interface OpenGitDiffTabInput {
  path: string
  diffSource?: GitDiffTab['diffSource']
  commitOid?: string
  oldContent: string
  newContent: string
  language: string
  tabLabel: string
}

export interface OpenGitDiffTabResult {
  tabs: GitDiffTab[]
  activeIndex: number
}

/** Open or focus an inline git diff tab for the given path. */
export function openGitDiffTabState(
  tabs: GitDiffTab[],
  input: OpenGitDiffTabInput,
): OpenGitDiffTabResult {
  const diffSource = input.diffSource ?? 'workdir'
  const prepared = prepareGitDiffForEditor(input.oldContent, input.newContent)
  const layout: GitDiffRenderLayout = resolveGitDiffRenderLayout(input.oldContent, input.newContent)
  const nextTab: GitDiffTab = {
    kind: 'git-diff',
    path: input.path,
    diffSource,
    commitOid: diffSource === 'commit' ? input.commitOid : undefined,
    name: input.tabLabel,
    oldContent: prepared.oldContent,
    newContent: prepared.newContent,
    language: input.language,
    truncated: prepared.truncated,
    originalOldLines: prepared.originalOldLines,
    originalNewLines: prepared.originalNewLines,
    shownOldLines: prepared.shownOldLines,
    shownNewLines: prepared.shownNewLines,
    layout,
  }

  const existingIndex = tabs.findIndex(
    (tab) =>
      tab.path === input.path &&
      tab.diffSource === diffSource &&
      (diffSource !== 'commit' || tab.commitOid === input.commitOid),
  )
  if (existingIndex >= 0) {
    const next = [...tabs]
    next[existingIndex] = nextTab
    return { tabs: next, activeIndex: existingIndex }
  }

  return { tabs: [...tabs, nextTab], activeIndex: tabs.length }
}
