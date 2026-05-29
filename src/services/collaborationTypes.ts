import type { CollabSignalingClient } from './collabRoomsApiService'

export type CollabConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export type CollabJoinOptions = {
  roomId: string
  userName: string
  userColor: string
  signaling?: CollabSignalingClient
  enableReconnect?: boolean
}

export type CollabStatusEvent = {
  status: CollabConnectionStatus
  roomId: string | null
  reconnectAttempt: number
}
