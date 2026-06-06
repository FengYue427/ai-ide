/** v1.5.3 — in-memory runtime queue pause (queue.before hook failure). */

export interface RuntimeQueuePauseState {
  paused: boolean
  reason: string
  hookId?: string
  specPath?: string
  at: string
}

type PauseListener = () => void

let pauseState: RuntimeQueuePauseState | null = null
const listeners = new Set<PauseListener>()

function emitPauseChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function getRuntimeQueuePause(): RuntimeQueuePauseState | null {
  return pauseState
}

export function isRuntimeQueuePaused(): boolean {
  return Boolean(pauseState?.paused)
}

export function setRuntimeQueuePaused(input: {
  reason: string
  hookId?: string
  specPath?: string
}): RuntimeQueuePauseState {
  pauseState = {
    paused: true,
    reason: input.reason,
    hookId: input.hookId,
    specPath: input.specPath,
    at: new Date().toISOString(),
  }
  emitPauseChange()
  return pauseState
}

export function clearRuntimeQueuePause(): void {
  if (!pauseState) return
  pauseState = null
  emitPauseChange()
}

export function subscribeRuntimeQueuePause(listener: PauseListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function formatHookPauseReason(hookId: string | undefined, message: string): string {
  if (hookId) return `Hook "${hookId}"：${message}`
  return message
}
