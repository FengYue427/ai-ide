import {
  TERMINAL_SESSIONS_META_KEY,
  getTerminalSessionsMetaPrefs,
  initTerminalSessions,
  normalizeTerminalSessionsMetaPrefs,
  type TerminalSessionsMetaPrefs,
} from '../lib/terminalSessionsManager'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

export async function loadTerminalSessionsMeta(): Promise<TerminalSessionsMetaPrefs | null> {
  const stored = await unifiedStorage.get<unknown>(TERMINAL_SESSIONS_META_KEY, null)
  return normalizeTerminalSessionsMetaPrefs(stored)
}

export async function persistTerminalSessionsMeta(meta: TerminalSessionsMetaPrefs): Promise<void> {
  await unifiedStorage.set(TERMINAL_SESSIONS_META_KEY, meta, { layer: StorageLayer.LOCAL })
}

export async function bootstrapTerminalSessionsFromStorage(): Promise<TerminalSessionsMetaPrefs> {
  const meta = await loadTerminalSessionsMeta()
  initTerminalSessions(meta)
  return getTerminalSessionsMetaPrefs()
}
