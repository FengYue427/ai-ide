import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const FILES_MAP_KEY = 'workspace-files'

export interface CollaborationRoom {
  roomId: string
  provider: WebrtcProvider
  doc: Y.Doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awareness: any
}

export class CollaborationService {
  private currentRoom: CollaborationRoom | null = null
  private callbacks: Map<string, ((data: unknown) => void)[]> = new Map()

  joinRoom(roomId: string, userName: string, userColor: string): CollaborationRoom {
    if (this.currentRoom?.roomId === roomId) {
      return this.currentRoom
    }

    this.leaveRoom()

    const doc = new Y.Doc()
    const provider = new WebrtcProvider(`ai-ide-${roomId}`, doc, {
      signaling: ['wss://signaling.yjs.dev'],
    })

    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
      cursor: null,
      selection: null,
    })

    this.currentRoom = {
      roomId,
      provider,
      doc,
      awareness: provider.awareness,
    }

    provider.awareness.on('change', () => {
      this.emit('users', Array.from(provider.awareness.getStates().values()))
    })

    return this.currentRoom
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      this.currentRoom.provider.destroy()
      this.currentRoom = null
    }
  }

  getCurrentRoom(): CollaborationRoom | null {
    return this.currentRoom
  }

  private getFilesMap(): Y.Map<string> {
    if (!this.currentRoom) {
      throw new Error('Not in a collaboration room')
    }
    return this.currentRoom.doc.getMap(FILES_MAP_KEY)
  }

  /** Seed local workspace into the shared Yjs map (on join). */
  pushWorkspaceFiles(files: { name: string; content: string }[]): void {
    if (!this.currentRoom || files.length === 0) return

    const map = this.getFilesMap()
    this.currentRoom.doc.transact(() => {
      for (const file of files) {
        map.set(file.name, file.content)
      }
    })
  }

  syncFile(filePath: string, content: string): void {
    if (!this.currentRoom) return

    const map = this.getFilesMap()
    if (map.get(filePath) !== content) {
      map.set(filePath, content)
    }
  }

  /** Subscribe to all file paths/content in the room. */
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

  /** @deprecated Use onWorkspaceFilesChange */
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
