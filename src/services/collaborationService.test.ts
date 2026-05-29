import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockAwareness = {
  setLocalStateField: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getStates: vi.fn(() => new Map()),
}

vi.mock('y-webrtc', () => ({
  WebrtcProvider: vi.fn(() => ({
    connected: true,
    awareness: mockAwareness,
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  })),
}))

import { CollaborationService } from './collaborationService'

describe('CollaborationService workspace map', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAwareness.getStates.mockReturnValue(new Map())
  })

  it('pushWorkspaceFiles and onWorkspaceFilesChange share content', () => {
    const service = new CollaborationService()
    service.joinRoom('test-room', 'Alice', '#58a6ff')

    service.pushWorkspaceFiles([{ name: 'index.js', content: 'console.log(1)' }])

    let snapshot: Record<string, string> = {}
    const unsub = service.onWorkspaceFilesChange((next) => {
      snapshot = next
    })

    expect(snapshot['index.js']).toBe('console.log(1)')

    service.syncFile('index.js', 'console.log(2)')
    expect(snapshot['index.js']).toBe('console.log(2)')

    unsub()
    service.leaveRoom()
  })
})
