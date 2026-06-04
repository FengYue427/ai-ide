import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGACY_AUTOSAVE_KEY, WORKSPACE_ROOTS_META_KEY } from '../lib/workspaceRoots'
import type { WorkspaceRootsMeta } from '../types/workspaceRoot'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

vi.mock('./cloudSyncService', () => ({
  cloudSyncService: { getAutoBackup: vi.fn().mockResolvedValue(null) },
}))
import {
  deleteWorkspaceRootAutosave,
  loadWorkspaceRootsForBootstrap,
  saveWorkspaceRootsMeta,
} from './workspaceRootsService'

vi.mock('../lib/v12Features', () => ({
  isMultiRootWorkspaceEnabled: () => true,
}))

describe('workspaceRootsService', () => {
  beforeEach(async () => {
    await unifiedStorage.remove(WORKSPACE_ROOTS_META_KEY)
    await unifiedStorage.remove(LEGACY_AUTOSAVE_KEY)
    await unifiedStorage.remove('autosave-default')
    await unifiedStorage.remove('autosave-secondary')
  })

  it('migrates legacy autosave-default into default root meta', async () => {
    await unifiedStorage.set(
      LEGACY_AUTOSAVE_KEY,
      [{ name: 'legacy.js', content: 'legacy', language: 'javascript' }],
      { layer: StorageLayer.INDEXED },
    )

    const fallback = [{ name: 'fallback.js', content: 'f', language: 'javascript' }]
    const { roots, activeRootId } = await loadWorkspaceRootsForBootstrap(fallback)

    expect(roots).toHaveLength(1)
    expect(activeRootId).toBe('default')
    expect(roots[0].files[0].name).toBe('legacy.js')

    const meta = await unifiedStorage.get<WorkspaceRootsMeta | null>(WORKSPACE_ROOTS_META_KEY, null)
    expect(meta?.roots).toHaveLength(1)
  })

  it('loads files per root from separate autosave keys', async () => {
    const meta = {
      activeRootId: 'a',
      roots: [
        { id: 'a', name: 'a', autosaveKey: 'autosave-a' },
        { id: 'b', name: 'b', autosaveKey: 'autosave-b' },
      ],
    }
    await saveWorkspaceRootsMeta(meta)
    await unifiedStorage.set(
      'autosave-a',
      [{ name: 'a.js', content: 'a', language: 'javascript' }],
      { layer: StorageLayer.INDEXED },
    )
    await unifiedStorage.set(
      'autosave-b',
      [{ name: 'b.js', content: 'b', language: 'javascript' }],
      { layer: StorageLayer.INDEXED },
    )

    const { roots, activeRootId } = await loadWorkspaceRootsForBootstrap([])
    expect(activeRootId).toBe('a')
    const rootA = roots.find((r) => r.id === 'a')
    const rootB = roots.find((r) => r.id === 'b')
    expect(rootA?.files[0].name).toBe('a.js')
    expect(rootB?.files[0].name).toBe('b.js')
  })

  it('deleteWorkspaceRootAutosave removes indexed key', async () => {
    await unifiedStorage.set(
      'autosave-secondary',
      [{ name: 'x.js', content: 'x', language: 'javascript' }],
      { layer: StorageLayer.INDEXED },
    )
    await deleteWorkspaceRootAutosave('autosave-secondary')
    const left = await unifiedStorage.get('autosave-secondary', null, {
      preferredLayer: StorageLayer.INDEXED,
    })
    expect(left).toBeNull()
  })
})
