import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import { getApiBaseUrl } from '../services/apiUtils'

const AUTH_TOKEN_KEY = 'auth-bearer-token'

/** Desktop offline shell (file://) talks to a remote API — cookies do not cross origins. */
export function needsCrossOriginAuth(): boolean {
  return Boolean(getApiBaseUrl())
}

export async function getStoredAuthToken(): Promise<string | null> {
  if (!needsCrossOriginAuth()) return null
  const token = await unifiedStorage.get<string | null>(AUTH_TOKEN_KEY, null, {
    preferredLayer: StorageLayer.LOCAL,
  })
  return typeof token === 'string' && token.trim() ? token.trim() : null
}

export async function persistAuthToken(token: string | null | undefined): Promise<void> {
  if (!needsCrossOriginAuth()) return
  const value = typeof token === 'string' && token.trim() ? token.trim() : null
  await unifiedStorage.set(AUTH_TOKEN_KEY, value, { layer: StorageLayer.LOCAL })
}

export async function clearAuthToken(): Promise<void> {
  await unifiedStorage.set(AUTH_TOKEN_KEY, null, { layer: StorageLayer.LOCAL })
}
