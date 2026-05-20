/**
 * Browser APIs used by unifiedStorage / idb in unit tests (Node has no indexedDB).
 */
import 'fake-indexeddb/auto'
import { vi } from 'vitest'

/**
 * y-webrtc connects to signaling via WebSocket — unavailable in Node CI.
 * Stub provider so CollaborationService unit tests exercise Yjs maps only.
 */
vi.mock('y-webrtc', () => {
  class MockWebrtcProvider {
    awareness = {
      setLocalStateField: vi.fn(),
      on: vi.fn(),
      getStates: () => new Map(),
    }
    destroy = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_room: string, _doc: unknown, _opts?: unknown) {}
  }
  return { WebrtcProvider: MockWebrtcProvider }
})
