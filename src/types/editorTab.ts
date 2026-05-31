import type { FileItem } from './file'

export interface FileTab extends FileItem {
  kind?: 'file'
}

export interface GitDiffTab {
  kind: 'git-diff'
  path: string
  /** Worktree, index (staged), or commit (history) diff source. */
  diffSource: 'workdir' | 'staged' | 'commit'
  /** Set when diffSource is `commit`. */
  commitOid?: string
  name: string
  oldContent: string
  newContent: string
  language: string
}

export function gitDiffTabKey(
  path: string,
  diffSource: GitDiffTab['diffSource'],
  commitOid?: string,
): string {
  if (diffSource === 'commit') return `${path}\0commit\0${commitOid ?? ''}`
  return `${path}\0${diffSource}`
}

export type EditorTab = FileTab | GitDiffTab

export function isGitDiffTab(tab: EditorTab): tab is GitDiffTab {
  return tab.kind === 'git-diff'
}

export function isFileTab(tab: EditorTab): tab is FileTab {
  return !isGitDiffTab(tab)
}

export function toFileItem(tab: FileTab): FileItem {
  return { name: tab.name, content: tab.content, language: tab.language }
}

export function editorTabsToFileItems(tabs: EditorTab[]): FileItem[] {
  return tabs.filter(isFileTab).map(toFileItem)
}

export function countFileTabs(tabs: EditorTab[]): number {
  return tabs.filter(isFileTab).length
}
