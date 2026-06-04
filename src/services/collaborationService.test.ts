import { describe, expect, it, vi, beforeEach } from 'vitest'

const localAwarenessState: Record<string, unknown> = {}

const mockAwareness = {
  setLocalStateField: vi.fn((key: string, value: unknown) => {
    localAwarenessState[key] = value
  }),
  getLocalState: vi.fn(() => ({ ...localAwarenessState })),
  on: vi.fn(),
  off: vi.fn(),
  getStates: vi.fn(() => new Map()),
}

let webrtcStatusHandler: ((event: { connected: boolean }) => void) | null = null

vi.mock('y-webrtc', () => ({
  WebrtcProvider: vi.fn(() => ({
    connected: true,
    awareness: mockAwareness,
    on: vi.fn((event: string, handler: (payload: { connected: boolean }) => void) => {
      if (event === 'status') webrtcStatusHandler = handler
    }),
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
    webrtcStatusHandler = null
    for (const key of Object.keys(localAwarenessState)) {
      delete localAwarenessState[key]
    }
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

  it('schedules reconnect after signaling disconnect (M1 F2)', () => {
    vi.useFakeTimers()
    const service = new CollaborationService()
    service.joinRoom('reconnect-room', 'Alice', '#58a6ff')
    expect(service.getConnectionStatus()).toBe('connected')

    webrtcStatusHandler?.({ connected: false })
    expect(service.getConnectionStatus()).toBe('reconnecting')
    expect(service.getReconnectAttempt()).toBe(0)

    vi.advanceTimersByTime(1000)
    expect(service.getReconnectAttempt()).toBe(1)

    vi.useRealTimers()
    service.leaveRoom()
  })

  it('tryReconnect resets backoff and re-attaches provider', () => {
    const service = new CollaborationService()
    service.joinRoom('manual-reconnect', 'Bob', '#58a6ff')
    webrtcStatusHandler?.({ connected: false })
    expect(service.getConnectionStatus()).toBe('reconnecting')

    service.tryReconnect()
    expect(service.getReconnectAttempt()).toBe(0)
    expect(['connecting', 'connected']).toContain(service.getConnectionStatus())

    service.leaveRoom()
  })

  it('updateEditorPresence publishes cursor and selection to awareness', () => {
    vi.useFakeTimers()
    const service = new CollaborationService()
    service.joinRoom('presence-room', 'Alice', '#58a6ff')

    service.updateEditorPresence('index.js', {
      startLine: 1,
      startColumn: 1,
      endLine: 2,
      endColumn: 4,
    })
    vi.advanceTimersByTime(80)

    expect(mockAwareness.setLocalStateField).toHaveBeenLastCalledWith('user', {
      name: 'Alice',
      color: '#58a6ff',
      cursor: { filePath: 'index.js', line: 2, column: 4 },
      selection: {
        filePath: 'index.js',
        startLine: 1,
        startColumn: 1,
        endLine: 2,
        endColumn: 4,
      },
    })

    vi.useRealTimers()
    service.leaveRoom()
  })
})
