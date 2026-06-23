/**
 * AIDE Link — cross-module event bus (Phase 5.1).
 */
export type AideLinkEventType =
  | 'workspace-mode-changed'
  | 'spec-acceptance-ready'
  | 'spec-tasks-open'
  | 'git-commit-blocked'
  | 'share-created'
  | 'share-progress-local'
  | 'queue-active'
  | 'plan-file-focused'
  | 'mode-suggestion'
  | 'quota-exceeded'
  | 'entitlement-blocked'
  | 'linkage-graph-changed'
  | 'linkage-autopilot'

export interface AideLinkEvent {
  type: AideLinkEventType
  at: string
  payload?: Record<string, unknown>
}

type Listener = (event: AideLinkEvent) => void

const listeners = new Set<Listener>()
let lastEvent: AideLinkEvent | null = null

export function emitAideLinkEvent(type: AideLinkEventType, payload?: Record<string, unknown>): AideLinkEvent {
  const event: AideLinkEvent = { type, at: new Date().toISOString(), payload }
  lastEvent = event
  listeners.forEach((listener) => listener(event))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aide:link', { detail: event }))
  }
  return event
}

export function subscribeAideLink(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLastAideLinkEvent(): AideLinkEvent | null {
  return lastEvent
}
