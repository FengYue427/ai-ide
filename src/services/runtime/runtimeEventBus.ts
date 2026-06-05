/** v1.4.8 — in-memory Activity Line event bus (ADR D6). */

export const RUNTIME_EVENT_TYPES = [
  'queue.progress',
  'agent.fileWrite',
  'hook.start',
  'hook.end',
  'verify.fail',
] as const

export type RuntimeEventType = (typeof RUNTIME_EVENT_TYPES)[number]

export interface RuntimeEvent {
  type: RuntimeEventType
  at: string
  message: string
  meta?: Record<string, string | number | boolean>
}

export type RuntimeEventListener = (event: RuntimeEvent) => void

const MAX_EVENTS = 50
const listeners = new Set<RuntimeEventListener>()
const recentEvents: RuntimeEvent[] = []

function isRuntimeEventType(value: string): value is RuntimeEventType {
  return (RUNTIME_EVENT_TYPES as readonly string[]).includes(value)
}

export function publishRuntimeEvent(event: RuntimeEvent): void {
  if (!isRuntimeEventType(event.type)) return
  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_EVENTS)
  }
  for (const listener of listeners) {
    listener(event)
  }
}

export function subscribeRuntimeEvents(listener: RuntimeEventListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getRecentRuntimeEvents(limit = MAX_EVENTS): RuntimeEvent[] {
  return recentEvents.slice(-limit)
}

export function clearRuntimeEvents(): void {
  recentEvents.length = 0
}

/** E2E harness: expose bus for Playwright evaluate. */
export function exposeRuntimeEventBusForE2E(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  if (localStorage.getItem('ai-ide:e2e-harness') !== '1') return
  ;(window as Window & { __AIDE_RUNTIME_EVENT_BUS__?: typeof runtimeEventBusApi }).__AIDE_RUNTIME_EVENT_BUS__ =
    runtimeEventBusApi
}

const runtimeEventBusApi = {
  publish: publishRuntimeEvent,
  getRecent: getRecentRuntimeEvents,
  clear: clearRuntimeEvents,
}

if (typeof window !== 'undefined') {
  exposeRuntimeEventBusForE2E()
}
