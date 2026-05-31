import type { GitDiffTab } from '../types/editorTab'

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
  const nextTab: GitDiffTab = {
    kind: 'git-diff',
    path: input.path,
    diffSource,
    commitOid: diffSource === 'commit' ? input.commitOid : undefined,
    name: input.tabLabel,
    oldContent: input.oldContent,
    newContent: input.newContent,
    language: input.language,
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
