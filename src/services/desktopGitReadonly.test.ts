import { describe, expect, it, vi, beforeEach } from 'vitest'
import { tryDesktopGitReadonlySnapshot } from './desktopGitReadonly'

vi.mock('./desktopBridge', () => ({
  isDesktopApp: vi.fn(() => true),
  getDesktopApi: vi.fn(),
}))

vi.mock('./localProjectService', () => ({
  getElectronRootPath: vi.fn(() => '/project'),
}))

import { getDesktopApi } from './desktopBridge'

describe('tryDesktopGitReadonlySnapshot', () => {
  beforeEach(() => {
    vi.mocked(getDesktopApi).mockReturnValue({
      readGitReadonlySnapshot: vi.fn(async () => ({
        ok: true,
        statusPorcelain: ' M app.ts\0',
        branch: 'main',
        branches: ['main', 'dev'],
      })),
    } as any)
  })

  it('returns parsed snapshot from desktop IPC', async () => {
    const snapshot = await tryDesktopGitReadonlySnapshot()
    expect(snapshot?.source).toBe('desktop-cli')
    expect(snapshot?.branch).toBe('main')
    expect(snapshot?.status).toEqual([
      { filepath: 'app.ts', staged: false, status: 'modified' },
    ])
  })

  it('returns null when IPC fails', async () => {
    vi.mocked(getDesktopApi).mockReturnValue({
      readGitReadonlySnapshot: vi.fn(async () => ({ ok: false, reason: 'NO_GIT' })),
    } as any)
    expect(await tryDesktopGitReadonlySnapshot()).toBeNull()
  })
})
