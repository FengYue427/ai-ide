import {
  ConnectionState,
  Room,
  RoomEvent,
  type RemoteParticipant,
} from 'livekit-client'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { ObservableV2 } from 'lib0/observable'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import type { CollabYjsProvider } from './collabYjsProviderTypes'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const MESSAGE_QUERY_AWARENESS = 3
const YJS_DATA_TOPIC = 'yjs'

type LivekitYjsProviderEvents = {
  status: (event: { connected: boolean }) => void
}

export type LivekitYjsProviderOptions = {
  url: string
  token: string
  doc: Y.Doc
  awareness?: awarenessProtocol.Awareness
}

/**
 * Yjs sync + awareness over LiveKit participant data packets (v1.1.3.2).
 */
export class LivekitYjsProvider
  extends ObservableV2<LivekitYjsProviderEvents>
  implements CollabYjsProvider
{
  readonly awareness: awarenessProtocol.Awareness
  private readonly doc: Y.Doc
  private readonly room: Room
  private readonly originTag = {}
  private destroyed = false
  private shouldConnect = true
  private synced = false

  constructor(options: LivekitYjsProviderOptions) {
    super()
    this.doc = options.doc
    this.awareness = options.awareness ?? new awarenessProtocol.Awareness(this.doc)
    this.room = new Room({ adaptiveStream: false, dynacast: false })

    this.doc.on('update', this.onDocUpdate)
    this.awareness.on('update', this.onAwarenessUpdate)
    this.doc.on('destroy', this.destroy)

    this.room.on(RoomEvent.Connected, this.onRoomConnected)
    this.room.on(RoomEvent.Reconnected, this.onRoomReconnected)
    this.room.on(RoomEvent.Disconnected, this.onRoomDisconnected)
    this.room.on(RoomEvent.ParticipantConnected, this.onParticipantConnected)
    this.room.on(RoomEvent.DataReceived, this.onDataReceived)

    void this.connectRoom(options.url, options.token)
  }

  get connected(): boolean {
    return (
      !this.destroyed &&
      this.shouldConnect &&
      this.room.state === ConnectionState.Connected
    )
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.shouldConnect = false

    this.doc.off('update', this.onDocUpdate)
    this.awareness.off('update', this.onAwarenessUpdate)
    this.doc.off('destroy', this.destroy)

    this.room.off(RoomEvent.Connected, this.onRoomConnected)
    this.room.off(RoomEvent.Reconnected, this.onRoomReconnected)
    this.room.off(RoomEvent.Disconnected, this.onRoomDisconnected)
    this.room.off(RoomEvent.ParticipantConnected, this.onParticipantConnected)
    this.room.off(RoomEvent.DataReceived, this.onDataReceived)

    void this.room.disconnect()
    this.awareness.destroy()
    this.emitStatus()
  }

  private async connectRoom(url: string, token: string): Promise<void> {
    if (this.destroyed || !this.shouldConnect) return
    try {
      await this.room.connect(url, token)
    } catch {
      this.emitStatus()
    }
  }

  private onRoomConnected = (): void => {
    this.synced = false
    for (const participant of this.room.remoteParticipants.values()) {
      this.offerSyncTo(participant)
    }
    this.broadcastAwarenessQuery()
    this.emitStatus()
  }

  private onRoomReconnected = (): void => {
    this.onRoomConnected()
  }

  private onRoomDisconnected = (): void => {
    this.synced = false
    this.emitStatus()
  }

  private onParticipantConnected = (participant: RemoteParticipant): void => {
    this.offerSyncTo(participant)
    this.broadcastAwarenessQuery([participant.identity])
  }

  private onDataReceived = (
    payload: Uint8Array,
    _participant?: RemoteParticipant,
    _kind?: unknown,
    topic?: string,
  ): void => {
    if (topic && topic !== YJS_DATA_TOPIC) return
    this.readMessage(payload)
  }

  private onDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === this.originTag || this.destroyed || !this.connected) return
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    void this.publish(encoding.toUint8Array(encoder))
  }

  private onAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ): void => {
    if (origin === this.originTag || this.destroyed || !this.connected) return
    const changedClients = added.concat(updated).concat(removed)
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
    )
    void this.publish(encoding.toUint8Array(encoder))
  }

  private offerSyncTo(participant: RemoteParticipant): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(encoder, this.doc)
    void this.publish(encoding.toUint8Array(encoder), [participant.identity])
  }

  private broadcastAwarenessQuery(destinations?: string[]): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_QUERY_AWARENESS)
    void this.publish(encoding.toUint8Array(encoder), destinations)
  }

  private readMessage(buf: Uint8Array): void {
    const decoder = decoding.createDecoder(buf)
    const encoder = encoding.createEncoder()
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case MESSAGE_SYNC: {
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        const syncType = syncProtocol.readSyncMessage(
          decoder,
          encoder,
          this.doc,
          this.originTag,
        )
        if (syncType === syncProtocol.messageYjsSyncStep2 && !this.synced) {
          this.synced = true
        }
        if (syncType === syncProtocol.messageYjsSyncStep1) {
          const reply = encoding.toUint8Array(encoder)
          if (reply.byteLength > 0) {
            void this.publish(reply)
          }
        } else {
          const reply = encoding.toUint8Array(encoder)
          if (reply.byteLength > 1) {
            void this.publish(reply)
          }
        }
        break
      }
      case MESSAGE_QUERY_AWARENESS: {
        const replyEncoder = encoding.createEncoder()
        encoding.writeVarUint(replyEncoder, MESSAGE_AWARENESS)
        encoding.writeVarUint8Array(
          replyEncoder,
          awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            Array.from(this.awareness.getStates().keys()),
          ),
        )
        void this.publish(encoding.toUint8Array(replyEncoder))
        break
      }
      case MESSAGE_AWARENESS:
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          decoding.readVarUint8Array(decoder),
          this.originTag,
        )
        break
      default:
        break
    }
  }

  private async publish(data: Uint8Array, destinationIdentities?: string[]): Promise<void> {
    if (this.destroyed || !this.connected) return
    try {
      await this.room.localParticipant.publishData(data, {
        reliable: true,
        topic: YJS_DATA_TOPIC,
        destinationIdentities,
      })
    } catch {
      // ignore transient publish failures during reconnect
    }
  }

  private emitStatus(): void {
    this.emit('status', [{ connected: this.connected }])
  }
}
