import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defaultWorkspaceRoot } from '../lib/workspaceRoots'
import { useIDEStore } from './ideStore'

describe('ideStore', () => {
  beforeEach(() => {
    const root = defaultWorkspaceRoot([
      { name: 'index.js', content: '// test', language: 'javascript' },
    ])
    useIDEStore.setState({
      files: root.files,
      workspaceRoots: [root],
      activeRootId: root.id,
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

  it('clamps active file when files are deleted', () => {
    const { setFiles } = useIDEStore.getState()
    setFiles([
      { name: 'a.ts', content: 'a', language: 'typescript' },
      { name: 'b.ts', content: 'b', language: 'typescript' },
      { name: 'c.ts', content: 'c', language: 'typescript' },
    ])
    useIDEStore.getState().setActiveFile(2)
    setFiles([{ name: 'only.ts', content: 'x', language: 'typescript' }])
    expect(useIDEStore.getState().activeFile).toBe(0)
  })

  it('switches workspace roots when multi-root enabled', () => {
    vi.stubEnv('VITE_MULTI_ROOT', 'true')
    const { addWorkspaceRoot, setActiveWorkspaceRoot, setFiles } = useIDEStore.getState()
    setFiles([{ name: 'main.js', content: 'main', language: 'javascript' }])
    addWorkspaceRoot('secondary')
    expect(useIDEStore.getState().workspaceRoots).toHaveLength(2)
    expect(useIDEStore.getState().files[0].name).toBe('index.js')

    setFiles([{ name: 'sec.js', content: 'sec', language: 'javascript' }])
    const primaryId = useIDEStore.getState().workspaceRoots[0].id
    setActiveWorkspaceRoot(primaryId)
    expect(useIDEStore.getState().files[0].name).toBe('main.js')
    vi.unstubAllEnvs()
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
