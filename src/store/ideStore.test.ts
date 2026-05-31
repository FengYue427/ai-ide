import { describe, expect, it, beforeEach } from 'vitest'
import { useIDEStore } from './ideStore'

describe('ideStore', () => {
  beforeEach(() => {
    useIDEStore.setState({
      files: [{ name: 'index.js', content: '// test', language: 'javascript' }],
      gitDiffTabs: [],
      activeEditorSurface: 'file',
      activeGitDiffTab: 0,
      activeFile: 0,
      showChatPanel: false,
      showGitPanel: false,
    })
  })

  it('updates files and active index', () => {
    const { setFiles, setActiveFile } = useIDEStore.getState()
    setFiles([
      { name: 'a.ts', content: 'a', language: 'typescript' },
      { name: 'b.ts', content: 'b', language: 'typescript' },
    ])
    setActiveFile(1)

    const state = useIDEStore.getState()
    expect(state.files).toHaveLength(2)
    expect(state.activeFile).toBe(1)
    expect(state.files[1].name).toBe('b.ts')
  })

  it('toggles git panel and closes chat', () => {
    useIDEStore.getState().setShowChatPanel(true)
    useIDEStore.getState().setShowGitPanel((prev) => {
      if (!prev) useIDEStore.getState().setShowChatPanel(false)
      return !prev
    })

    const state = useIDEStore.getState()
    expect(state.showGitPanel).toBe(true)
    expect(state.showChatPanel).toBe(false)
  })

  it('shifts queued spec execution in order', () => {
    const { setQueuedSpecExecutions, shiftQueuedSpecExecution } = useIDEStore.getState()
    setQueuedSpecExecutions([
      {
        prompt: 'first',
        backfill: { taskPath: '.aide/specs/a/tasks.md', taskText: 'task 1', specAcceptancePath: '.aide/specs/a/acceptance.md' },
      },
      {
        prompt: 'second',
        backfill: { taskPath: '.aide/specs/a/tasks.md', taskText: 'task 2', specAcceptancePath: '.aide/specs/a/acceptance.md' },
      },
    ])
    const first = shiftQueuedSpecExecution()
    const second = shiftQueuedSpecExecution()

    expect(first?.prompt).toBe('first')
    expect(second?.prompt).toBe('second')
    expect(useIDEStore.getState().queuedSpecExecutions).toHaveLength(0)
  })

  it('opens git diff tab from store action', () => {
    const { openGitDiffTab } = useIDEStore.getState()
    openGitDiffTab({
      path: 'app.ts',
      diffSource: 'workdir',
      oldContent: 'old',
      newContent: 'new',
      language: 'typescript',
      tabLabel: 'app.ts (diff)',
    })

    const state = useIDEStore.getState()
    expect(state.gitDiffTabs).toHaveLength(1)
    expect(state.activeEditorSurface).toBe('git-diff')
    expect(state.activeGitDiffTab).toBe(0)
    expect(state.gitDiffTabs[0]).toMatchObject({
      kind: 'git-diff',
      path: 'app.ts',
      diffSource: 'workdir',
      name: 'app.ts (diff)',
    })
  })
})
