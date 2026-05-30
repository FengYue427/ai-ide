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

const mockLivekitProvider = vi.fn(() => ({
  connected: true,
  awareness: mockAwareness,
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock('./collab/livekitYjsProvider', () => ({
  LivekitYjsProvider: vi.fn(function LivekitYjsProviderMock() {
    return mockLivekitProvider()
  }),
}))

import { CollaborationService } from './collaborationService'
import { WebrtcProvider } from 'y-webrtc'
import { LivekitYjsProvider } from './collab/livekitYjsProvider'

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

  it('viewer role does not push file updates to Yjs', () => {
    const service = new CollaborationService()
    service.joinRoom({
      roomId: 'view-room',
      userName: 'Viewer',
      userColor: '#58a6ff',
      memberRole: 'viewer',
    })

    expect(service.canWriteToRoom()).toBe(false)
    service.pushWorkspaceFiles([{ name: 'a.js', content: '1' }])
    service.syncFile('a.js', '2')

    let snapshot: Record<string, string> = {}
    service.onWorkspaceFilesChange((next) => {
      snapshot = next
    })
    expect(snapshot['a.js']).toBeUndefined()

    service.leaveRoom()
  })

  it('applyMemberRole toggles write without reconnecting', () => {
    const service = new CollaborationService()
    service.joinRoom({
      roomId: 'role-room',
      userName: 'User',
      userColor: '#58a6ff',
      memberRole: 'viewer',
    })
    expect(service.canWriteToRoom()).toBe(false)
    service.applyMemberRole('editor')
    expect(service.canWriteToRoom()).toBe(true)
    service.leaveRoom()
  })

  it('uses LivekitYjsProvider when API returns livekit signaling', () => {
    const service = new CollaborationService()
    service.joinRoom({
      roomId: 'lk-room',
      userName: 'Host',
      userColor: '#58a6ff',
      signaling: {
        mode: 'livekit',
        roomChannel: 'ai-ide-lk-room',
        livekitUrl: 'wss://livekit.example.com',
        livekitToken: 'eyJ.test',
      },
    })

    expect(LivekitYjsProvider).toHaveBeenCalledWith({
      url: 'wss://livekit.example.com',
      token: 'eyJ.test',
      doc: expect.any(Object),
    })
    expect(WebrtcProvider).not.toHaveBeenCalled()
    service.leaveRoom()
  })

  it('falls back to WebrtcProvider when livekit token missing', () => {
    const service = new CollaborationService()
    service.joinRoom({
      roomId: 'webrtc-room',
      userName: 'Host',
      userColor: '#58a6ff',
      signaling: {
        mode: 'livekit',
        roomChannel: 'ai-ide-webrtc-room',
        livekitUrl: 'wss://livekit.example.com',
      },
    })

    expect(WebrtcProvider).toHaveBeenCalled()
    expect(LivekitYjsProvider).not.toHaveBeenCalled()
    service.leaveRoom()
  })
})
