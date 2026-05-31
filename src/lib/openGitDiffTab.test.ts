import { describe, expect, it } from 'vitest'
import { openGitDiffTabState } from './openGitDiffTab'
import type { GitDiffTab } from '../types/editorTab'

const diffInput = {
  path: 'index.js',
  oldContent: 'console.log(0)',
  newContent: 'console.log(1)',
  language: 'javascript',
  tabLabel: 'index.js (diff)',
}

describe('openGitDiffTabState', () => {
  it('appends a new git diff tab and focuses it', () => {
    const result = openGitDiffTabState([], diffInput)

    expect(result.tabs).toHaveLength(1)
    expect(result.activeIndex).toBe(0)
    expect(result.tabs[0]).toMatchObject({
      kind: 'git-diff',
      path: 'index.js',
      name: 'index.js (diff)',
    })
  })

  it('reuses an existing diff tab for the same path', () => {
    const first = openGitDiffTabState([], diffInput)
    const updated = openGitDiffTabState(first.tabs, {
      ...diffInput,
      newContent: 'console.log(2)',
    })

    expect(updated.tabs).toHaveLength(1)
    expect(updated.activeIndex).toBe(0)
    expect(updated.tabs[0]).toMatchObject({
      kind: 'git-diff',
      newContent: 'console.log(2)',
    })
  })

  it('reuses commit diff tab for the same path and commit', () => {
    const first = openGitDiffTabState([], {
      ...diffInput,
      diffSource: 'commit',
      commitOid: 'abc1234',
      tabLabel: 'index.js @abc1234',
      newContent: 'v1',
    })
    const updated = openGitDiffTabState(first.tabs, {
      ...diffInput,
      diffSource: 'commit',
      commitOid: 'abc1234',
      tabLabel: 'index.js @abc1234',
      newContent: 'v2',
    })

    expect(updated.tabs).toHaveLength(1)
    expect(updated.tabs[0]?.newContent).toBe('v2')
  })

  it('keeps separate tabs for workdir and staged sources', () => {
    const workdir = openGitDiffTabState([], { ...diffInput, diffSource: 'workdir' })
    const both = openGitDiffTabState(workdir.tabs, {
      ...diffInput,
      diffSource: 'staged',
      tabLabel: 'index.js (staged)',
      newContent: 'staged',
    })

    expect(both.tabs).toHaveLength(2)
    expect(both.tabs.map((tab) => tab.diffSource)).toEqual(['workdir', 'staged'])
  })

  it('truncates oversized diff content for Monaco', () => {
    const huge = `${'line\n'.repeat(2500)}`
    const result = openGitDiffTabState([], {
      ...diffInput,
      oldContent: huge,
      newContent: 'small',
    })

    expect(result.tabs[0]?.truncated).toBe(true)
    expect(result.tabs[0]?.shownOldLines).toBe(2000)
    expect(result.tabs[0]?.originalOldLines).toBe(2501)
    expect(result.tabs[0]?.oldContent.split('\n').length).toBe(2000)
  })

  it('keeps separate tabs for different paths', () => {
    const first = openGitDiffTabState([], diffInput)
    const second = openGitDiffTabState(first.tabs, {
      ...diffInput,
      path: 'app.ts',
      tabLabel: 'app.ts (diff)',
    })

    expect(second.tabs).toHaveLength(2)
    expect(second.activeIndex).toBe(1)
    expect(second.tabs.map((tab: GitDiffTab) => tab.path)).toEqual(['index.js', 'app.ts'])
  })
})
