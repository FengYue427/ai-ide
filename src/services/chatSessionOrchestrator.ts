export type ChatSessionStatus =
  | 'idle'
  | 'running'
  | 'queued'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type PendingSend = {
  text: string
  action?: 'explain' | 'refactor' | 'fix' | 'generate'
  options?: { forceSlim?: boolean }
}

export type ChatSessionState = {
  status: ChatSessionStatus
  runId: string | null
  queue: PendingSend[]
}

export function createInitialChatSessionState(): ChatSessionState {
  return { status: 'idle', runId: null, queue: [] }
}

export function startRun(state: ChatSessionState): ChatSessionState {
  return {
    ...state,
    status: 'running',
    runId: `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  }
}

export function enqueueSend(state: ChatSessionState, pending: PendingSend): ChatSessionState {
  const queue = [...state.queue, pending]
  return {
    ...state,
    queue,
    status: state.status === 'running' ? 'queued' : state.status,
  }
}

export function completeRun(state: ChatSessionState, result: Exclude<ChatSessionStatus, 'idle' | 'running' | 'queued'>): ChatSessionState {
  return {
    ...state,
    status: state.queue.length > 0 ? 'queued' : result,
    runId: null,
  }
}

export function shiftQueue(state: ChatSessionState): { next: PendingSend | null; state: ChatSessionState } {
  if (state.queue.length === 0) return { next: null, state }
  const [next, ...rest] = state.queue
  return {
    next,
    state: { ...state, queue: rest, status: rest.length > 0 ? 'queued' : state.status },
  }
}
