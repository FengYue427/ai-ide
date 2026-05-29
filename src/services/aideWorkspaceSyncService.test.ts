import { beforeEach, describe, expect, it, vi } from 'vitest'

const addFile = vi.fn(async () => true)
const createContext = vi.fn(async () => ({ name: '.aide', files: [], rootPath: '/' }))
const getContext = vi.fn(() => null)

vi.mock('./workspaceContextService', () => ({
  workspaceContextService: {
    get getContext() {
      return getContext
    },
    get createContext() {
      return createContext
    },
    get addFile() {
      return addFile
    },
  },
}))

import { listAideEditorFiles, syncAideFilesToWorkspace } from './aideWorkspaceSyncService'

describe('aideWorkspaceSyncService', () => {
  beforeEach(() => {
    addFile.mockClear()
    createContext.mockClear()
    getContext.mockReturnValue(null)
  })

  it('lists only .aide paths', () => {
    const files = [
      { name: '.aide/plans/a.md', content: '# A', language: 'markdown' },
      { name: 'index.html', content: '<html></html>', language: 'html' },
    ]
    expect(listAideEditorFiles(files)).toHaveLength(1)
  })

  it('syncs aide files into workspace context', async () => {
    const files = [{ name: '.aide/plans/a.md', content: '# A', language: 'markdown' }]
    const result = await syncAideFilesToWorkspace(files)
    expect(createContext).toHaveBeenCalled()
    expect(addFile).toHaveBeenCalledTimes(1)
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
  })
})
