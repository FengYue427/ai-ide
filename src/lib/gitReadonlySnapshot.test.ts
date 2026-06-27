import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadGitReadonlySnapshot } from './gitReadonlySnapshot'

const tryDesktopGitReadonlySnapshot = vi.fn()

vi.mock('../services/desktopGitReadonly', () => ({
  tryDesktopGitReadonlySnapshot: (...args: unknown[]) => tryDesktopGitReadonlySnapshot(...args),
}))

vi.mock('../services/gitService', () => ({
  getStatus: vi.fn(),
  getCurrentBranch: vi.fn(),
  listBranches: vi.fn(),
}))

describe('loadGitReadonlySnapshot', () => {
  beforeEach(() => {
    tryDesktopGitReadonlySnapshot.mockReset()
  })

  it('prefers desktop CLI snapshot before requiring in-memory fs', async () => {
    tryDesktopGitReadonlySnapshot.mockResolvedValue({
      status: [],
      branch: 'main',
      branches: ['main'],
      source: 'desktop-cli',
    })

    const result = await loadGitReadonlySnapshot(null)

    expect(result?.source).toBe('desktop-cli')
    expect(tryDesktopGitReadonlySnapshot).toHaveBeenCalledOnce()
  })

  it('returns null when neither desktop nor fs is available', async () => {
    tryDesktopGitReadonlySnapshot.mockResolvedValue(null)

    const result = await loadGitReadonlySnapshot(null)

    expect(result).toBeNull()
  })
})
