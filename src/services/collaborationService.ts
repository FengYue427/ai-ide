import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export interface CollaborationRoom {
  roomId: string
  provider: WebrtcProvider
  doc: Y.Doc
  awareness: any
}

export class CollaborationService {
  private currentRoom: CollaborationRoom | null = null
  private callbacks: Map<string, ((data: any) => void)[]> = new Map()

  joinRoom(roomId: string, userName: string, userColor: string): CollaborationRoom {
    if (this.currentRoom?.roomId === roomId) {
      return this.currentRoom
    }

    // 离开当前房间
    this.leaveRoom()

    const doc = new Y.Doc()
    const provider = new WebrtcProvider(`ai-ide-${roomId}`, doc, {
      signaling: ['wss://signaling.yjs.dev']
    })

    // 设置用户意识状态
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
      cursor: null,
      selection: null
    })

    this.currentRoom = {
      roomId,
      provider,
      doc,
      awareness: provider.awareness
    }

    // 监听其他用户变化
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

  // 共享文件内容
  syncFile(filePath: string, content: string): void {
    if (!this.currentRoom) return
    
    const yText = this.currentRoom.doc.getText(filePath)
    
    // 仅在内容不同时更新
    if (yText.toString() !== content) {
      yText.delete(0, yText.length)
      yText.insert(0, content)
    }
  }

  // 监听文件变化
  onFileChange(filePath: string, callback: (content: string) => void): () => void {
    if (!this.currentRoom) return () => {}

    const yText = this.currentRoom.doc.getText(filePath)
    
    const handler = () => {
      callback(yText.toString())
    }

    yText.observe(handler)
    
    // 返回取消订阅函数
    return () => yText.unobserve(handler)
  }

  // 更新光标位置
  updateCursor(filePath: string, line: number, column: number): void {
    if (!this.currentRoom) return

    const user = this.currentRoom.awareness.getLocalState()?.user
    if (user) {
      this.currentRoom.awareness.setLocalStateField('user', {
        ...user,
        cursor: { filePath, line, column }
      })
    }
  }

  // 获取在线用户
  getOnlineUsers(): any[] {
    if (!this.currentRoom) return []
    return Array.from(this.currentRoom.awareness.getStates().values())
  }

  // 事件订阅
  on(event: string, callback: (data: any) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) callbacks.splice(index, 1)
    }
  }

  private emit(event: string, data: any): void {
    this.callbacks.get(event)?.forEach(cb => cb(data))
  }
}

export const collaborationService = new CollaborationService()
