import { formatCollabApiError } from '../lib/collabApiErrors'
import { pickApiResponseMessage } from '../lib/apiUserMessage'
import type { TranslateFn } from '../i18n'
import { apiFetch, readJsonResponse } from './apiUtils'

export type CollabSignalingClient = {
  mode: 'yjs-webrtc' | 'livekit'
  roomChannel: string
  signalingUrls?: string[]
  livekitUrl?: string
  livekitToken?: string
}

export type CollabRoomClient = {
  id: string
  code: string
  name: string | null
  status: string
  hostId: string
  members: Array<{
    id: string
    userId: string
    role: string
    joinedAt: string
    leftAt: string | null
  }>
  signaling: CollabSignalingClient
}

export async function createCollabRoom(
  name?: string,
  t?: TranslateFn,
): Promise<{ room?: CollabRoomClient; error?: string; status?: number }> {
  const response = await apiFetch('/api/collab/rooms', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(name ? { name } : {}),
  })
  const json = await readJsonResponse<{ room?: CollabRoomClient; message?: string }>(response)
  if (!response.ok) {
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.createFailed') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { room: json?.room }
}

export async function fetchCollabRoom(
  code: string,
  t?: TranslateFn,
): Promise<{ room?: CollabRoomClient; error?: string; status?: number }> {
  const response = await apiFetch(`/api/collab/rooms/${encodeURIComponent(code)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const json = await readJsonResponse<{ room?: CollabRoomClient; message?: string }>(response)
  if (!response.ok) {
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.error.generic') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { room: json?.room, status: response.status }
}

export async function leaveCollabRoom(
  code: string,
  t?: TranslateFn,
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  const response = await apiFetch(`/api/collab/rooms/${encodeURIComponent(code)}/leave`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const json = await readJsonResponse<{ success?: boolean; message?: string }>(response)
  if (!response.ok) {
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.leaveFailed') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { ok: true }
}

export async function joinCollabRoom(
  code: string,
  options?: { role?: 'editor' | 'viewer'; t?: TranslateFn },
): Promise<{ room?: CollabRoomClient; error?: string; status?: number }> {
  const response = await apiFetch(`/api/collab/rooms/${encodeURIComponent(code)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options?.role ? { role: options.role } : {}),
  })
  const json = await readJsonResponse<{ room?: CollabRoomClient; message?: string }>(response)
  if (!response.ok) {
    const t = options?.t
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.joinFailed') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { room: json?.room }
}

export async function updateCollabMemberRole(
  code: string,
  userId: string,
  role: 'editor' | 'viewer',
  t?: TranslateFn,
): Promise<{ room?: CollabRoomClient; error?: string; status?: number }> {
  const response = await apiFetch(
    `/api/collab/rooms/${encodeURIComponent(code)}/members/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    },
  )
  const json = await readJsonResponse<{ room?: CollabRoomClient; message?: string }>(response)
  if (!response.ok) {
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.roleUpdateFailed') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { room: json?.room }
}

export async function kickCollabMember(
  code: string,
  userId: string,
  t?: TranslateFn,
): Promise<{ room?: CollabRoomClient; error?: string; status?: number }> {
  const response = await apiFetch(
    `/api/collab/rooms/${encodeURIComponent(code)}/members/${encodeURIComponent(userId)}/kick`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
  )
  const json = await readJsonResponse<{ room?: CollabRoomClient; message?: string }>(response)
  if (!response.ok) {
    const serverMessage = pickApiResponseMessage(json ?? undefined, t)
    return {
      status: response.status,
      error: formatCollabApiError(
        response.status,
        serverMessage,
        t?.('collab.m1.kickFailed') ?? `HTTP ${response.status}`,
        t ?? ((key) => key),
      ),
    }
  }
  return { room: json?.room }
}
