import { describe, expect, it, vi, beforeEach } from 'vitest'
import { listWorkspaceEntries } from './workspaceCatalogService'

vi.mock('./cloudSyncService', () => ({
  cloudSyncService: {
    getAllWorkspaces: vi.fn(async () => [
      {
        id: 'local-1',
        name: 'offline-only',
        files: [{ name: 'a.js', content: '', language: 'javascript' }],
        settings: { theme: 'vs-dark', autoSave: true, language: 'zh' },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'local-2',
        name: 'default',
        files: [],
        settings: { theme: 'vs-dark', autoSave: true, language: 'zh' },
        createdAt: 2,
        updatedAt: 2,
      },
    ]),
  },
}))

vi.mock('./remoteWorkspaceService', () => ({
  remoteWorkspaceService: {
    listMetadata: vi.fn(async () => [
      {
        id: 'default',
        name: 'default',
        files: [],
        settings: { theme: 'vs-dark', autoSave: true, language: 'zh' },
        createdAt: 100,
        updatedAt: 100,
        source: 'cloud' as const,
        isDefault: true,
      },
    ]),
  },
}))

describe('workspaceCatalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges cloud list with local-only entries when logged in', async () => {
    const entries = await listWorkspaceEntries(true)
    const names = entries.map((e) => e.name)
    expect(names).toContain('default')
    expect(names).toContain('offline-only')
    expect(entries.find((e) => e.name === 'default')?.source).toBe('cloud')
    expect(entries.find((e) => e.name === 'offline-only')?.source).toBe('local')
  })

  it('returns only local entries when logged out', async () => {
    const entries = await listWorkspaceEntries(false)
    expect(entries.every((e) => e.source === 'local')).toBe(true)
    expect(entries).toHaveLength(2)
  })
})
