import { describe, expect, it, beforeEach } from 'vitest'
import { useIDEStore } from './ideStore'

describe('ideStore', () => {
  beforeEach(() => {
    useIDEStore.setState({
      files: [{ name: 'index.js', content: '// test', language: 'javascript' }],
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
})
