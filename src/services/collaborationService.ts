import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import type { CollabJoinOptions, CollabConnectionStatus, CollabStatusEvent } from './collaborationTypes'
import type { CollabMemberRole } from '../lib/collabPermissions'

const FILES_MAP_KEY = 'workspace-files'
const DEFAULT_SIGNALING = ['wss://signaling.yjs.dev']
/** Backoff steps — sum ≈30s for acceptance「断网 30s 内重连」. */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 15000]

export interface CollaborationRoom {
  roomId: string
  provider: WebrtcProvider
  doc: Y.Doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awareness: any
}

type PersistedSession = {
  roomId: string
  userName: string
  userColor: string
  signalingUrls: string[]
  webrtcRoomName: string
  enableReconnect: boolean
  canWrite: boolean
}

export class CollaborationService {
  private currentRoom: CollaborationRoom | null = null
  private callbacks: Map<string, ((data: unknown) => void)[]> = new Map()
  private session: PersistedSession | null = null
  private status: CollabConnectionStatus = 'idle'
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionalLeave = false
  private statusHandler: ((event: { connected: boolean }) => void) | null = null
  private awarenessHandler: (() => void) | null = null

  getConnectionStatus(): CollabConnectionStatus {
    return this.status
  }

  getReconnectAttempt(): number {
    return this.reconnectAttempt
  }

  joinRoom(
    roomIdOrOptions: string | CollabJoinOptions,
    userName?: string,
    userColor?: string,
  ): CollaborationRoom {
    const options: CollabJoinOptions =
      typeof roomIdOrOptions === 'string'
        ? {
            roomId: roomIdOrOptions,
            userName: userName ?? 'User',
            userColor: userColor ?? '#58a6ff',
            enableReconnect: true,
          }
        : roomIdOrOptions

    if (this.currentRoom?.roomId === options.roomId && this.status === 'connected') {
      return this.currentRoom
    }

    this.clearReconnectTimer()
    this.intentionalLeave = false
    this.teardownProvider()

    const signalingUrls =
      options.signaling?.signalingUrls?.filter(Boolean) ??
      (import.meta.env.VITE_COLLAB_SIGNALING_URL as string | undefined)?.trim()
        ? [String(import.meta.env.VITE_COLLAB_SIGNALING_URL).trim()]
        : DEFAULT_SIGNALING

    const webrtcRoomName =
      options.signaling?.roomChannel?.trim() || `ai-ide-${options.roomId}`

    this.session = {
      roomId: options.roomId,
      userName: options.userName,
      userColor: options.userColor,
      signalingUrls,
      webrtcRoomName,
      enableReconnect: options.enableReconnect !== false,
      canWrite: collabRoleCanWrite(options.memberRole),
    }

    this.reconnectAttempt = 0
    this.attachProvider()
    return this.currentRoom!
  }

  leaveRoom(): void {
    this.intentionalLeave = true
    this.clearReconnectTimer()
    this.setStatus('disconnected')
    this.teardownProvider(true)
    this.session = null
    this.reconnectAttempt = 0
  }

  /** Resume signaling after browser online / tab visible (M1 F2). */
  tryReconnect(): void {
    if (!this.session || this.intentionalLeave) return
    if (this.status === 'connected' || this.status === 'connecting') return
    this.clearReconnectTimer()
    this.reconnectAttempt = 0
    this.attachProvider()
  }

  getCurrentRoom(): CollaborationRoom | null {
    return this.currentRoom
  }

  /** Update write permission when server role changes (v1.1.3.1). */
  applyMemberRole(role: CollabMemberRole | null | undefined): void {
    if (!this.session) return
    this.session.canWrite = collabRoleCanWrite(role)
  }

  private attachProvider(): void {
    if (!this.session) return

    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting')

    const doc = this.currentRoom?.doc ?? new Y.Doc()
    const provider = new WebrtcProvider(this.session.webrtcRoomName, doc, {
      signaling: this.session.signalingUrls,
    })

    provider.awareness.setLocalStateField('user', {
      name: this.session.userName,
      color: this.session.userColor,
      cursor: null,
      selection: null,
    })

    if (this.statusHandler) {
      provider.off('status', this.statusHandler)
    }
    this.statusHandler = (event: { connected: boolean }) => {
      if (!this.session || this.intentionalLeave) return
      if (event.connected) {
        this.reconnectAttempt = 0
        this.clearReconnectTimer()
        this.setStatus('connected')
        return
      }
      if (this.status === 'connected' || this.status === 'reconnecting') {
        this.scheduleReconnect()
      }
    }
    provider.on('status', this.statusHandler)

    if (this.awarenessHandler) {
      provider.awareness.off('change', this.awarenessHandler)
    }
    this.awarenessHandler = () => {
      this.emit('users', Array.from(provider.awareness.getStates().values()))
    }
    provider.awareness.on('change', this.awarenessHandler)

    this.currentRoom = {
      roomId: this.session.roomId,
      provider,
      doc,
      awareness: provider.awareness,
    }

    if (provider.connected) {
      this.setStatus('connected')
    }
  }

  private scheduleReconnect(): void {
    if (!this.session?.enableReconnect || this.intentionalLeave) return
    if (this.reconnectTimer) return

    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)]
    this.setStatus('reconnecting')

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.session || this.intentionalLeave) return
      this.reconnectAttempt++
      this.teardownProvider()
      this.attachProvider()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private teardownProvider(destroyDoc = false): void {
    if (this.currentRoom) {
      if (this.statusHandler) {
        this.currentRoom.provider.off('status', this.statusHandler)
        this.statusHandler = null
      }
      if (this.awarenessHandler) {
        this.currentRoom.awareness.off('change', this.awarenessHandler)
        this.awarenessHandler = null
      }
      this.currentRoom.provider.destroy()
      if (destroyDoc) {
        this.currentRoom.doc.destroy()
      }
      this.currentRoom = null
    } else if (destroyDoc) {
      // no-op
    }
  }

  private setStatus(next: CollabConnectionStatus): void {
    if (this.status === next) return
    this.status = next
    const payload: CollabStatusEvent = {
      status: next,
      roomId: this.session?.roomId ?? null,
      reconnectAttempt: this.reconnectAttempt,
    }
    this.emit('status', payload)
  }

  private getFilesMap(): Y.Map<string> {
    if (!this.currentRoom) {
      throw new Error('Not in a collaboration room')
    }
    return this.currentRoom.doc.getMap(FILES_MAP_KEY)
  }

  canWriteToRoom(): boolean {
    return this.session?.canWrite !== false
  }

  pushWorkspaceFiles(files: { name: string; content: string }[]): void {
    if (!this.currentRoom || files.length === 0 || !this.canWriteToRoom()) return

    const map = this.getFilesMap()
    this.currentRoom.doc.transact(() => {
      for (const file of files) {
        map.set(file.name, file.content)
      }
    })
  }

  syncFile(filePath: string, content: string): void {
    if (!this.currentRoom || !this.canWriteToRoom()) return

    const map = this.getFilesMap()
    if (map.get(filePath) !== content) {
      map.set(filePath, content)
    }
  }

  onWorkspaceFilesChange(callback: (snapshot: Record<string, string>) => void): () => void {
    if (!this.currentRoom) return () => {}

    const map = this.getFilesMap()

    const emitSnapshot = () => {
      const snapshot: Record<string, string> = {}
      map.forEach((content, path) => {
        snapshot[path] = content
      })
      callback(snapshot)
    }

    map.observe(emitSnapshot)
    emitSnapshot()

    return () => map.unobserve(emitSnapshot)
  }

  onFileChange(filePath: string, callback: (content: string) => void): () => void {
    if (!this.currentRoom) return () => {}

    const map = this.getFilesMap()

    const handler = () => {
      const content = map.get(filePath)
      if (content !== undefined) callback(content)
    }

    map.observe(handler)
    handler()

    return () => map.unobserve(handler)
  }

  updateCursor(filePath: string, line: number, column: number): void {
    if (!this.currentRoom) return

    const user = this.currentRoom.awareness.getLocalState()?.user as Record<string, unknown> | undefined
    if (user) {
      this.currentRoom.awareness.setLocalStateField('user', {
        ...user,
        cursor: { filePath, line, column },
      })
    }
  }

  getOnlineUsers(): unknown[] {
    if (!this.currentRoom) return []
    return Array.from(this.currentRoom.awareness.getStates().values())
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: (data: unknown) => void): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) callbacks.splice(index, 1)
    }
  }

  private emit(event: string, data: unknown): void {
    this.callbacks.get(event)?.forEach((cb) => cb(data))
  }
}

export const collaborationService = new CollaborationService()

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => collaborationService.tryReconnect())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      collaborationService.tryReconnect()
    }
  })
}
