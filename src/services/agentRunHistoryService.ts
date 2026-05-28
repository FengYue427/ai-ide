import { unifiedStorage, StorageLayer } from './unifiedStorage'
import type { AgentActivityEntry } from './agentRunner'
import type { AgentFileChange } from './agentApplyService'

const HISTORY_KEY = 'agent-run-history'
const MAX_ITEMS = 20

export interface AgentRunHistoryItem {
  id: string
  createdAt: number
  summary: string
  rounds: number
  activity: AgentActivityEntry[]
  pendingChanges: AgentFileChange[]
}

export async function loadAgentRunHistory(): Promise<AgentRunHistoryItem[]> {
  const data = await unifiedStorage.get<AgentRunHistoryItem[] | null>(HISTORY_KEY, null)
  return Array.isArray(data) ? data : []
}

export async function saveAgentRunHistoryItem(item: Omit<AgentRunHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const existing = await loadAgentRunHistory()
  const next: AgentRunHistoryItem[] = [
    {
      id: `run-${Date.now().toString(36)}`,
      createdAt: Date.now(),
      ...item,
    },
    ...existing,
  ].slice(0, MAX_ITEMS)
  await unifiedStorage.set(HISTORY_KEY, next, { layer: StorageLayer.LOCAL })
}
