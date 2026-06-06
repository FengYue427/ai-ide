/** v1.5 F3 — recent hook / verify events per Spec. */

import type { RuntimeEvent } from './runtimeEventBus'

const SPEC_TASKS_RE = /^\.aide\/specs\/([^/]+)\/tasks\.md$/i

export function specNameFromTasksPath(tasksPath: string): string | null {
  return tasksPath.match(SPEC_TASKS_RE)?.[1] ?? null
}

export function isHookRelatedEvent(event: RuntimeEvent): boolean {
  return event.type === 'hook.start' || event.type === 'hook.end' || event.type === 'verify.fail'
}

export function eventMatchesSpec(event: RuntimeEvent, specName: string): boolean {
  const metaSpec = event.meta?.spec
  if (typeof metaSpec === 'string' && metaSpec === specName) return true
  return event.message.includes(specName)
}

export function getRecentHookEventsForSpec(
  specName: string,
  events: RuntimeEvent[],
  limit = 3,
): RuntimeEvent[] {
  return events
    .filter((event) => isHookRelatedEvent(event) && eventMatchesSpec(event, specName))
    .slice(-limit)
}

export function formatHookEventLine(event: RuntimeEvent): string {
  const status = typeof event.meta?.ok === 'boolean' ? (event.meta.ok ? 'ok' : 'fail') : ''
  return status ? `${event.type} · ${event.message} · ${status}` : `${event.type} · ${event.message}`
}

export function buildSpecHookLogMap(
  specNames: string[],
  events: RuntimeEvent[],
): Record<string, RuntimeEvent[]> {
  const map: Record<string, RuntimeEvent[]> = {}
  for (const name of specNames) {
    const recent = getRecentHookEventsForSpec(name, events)
    if (recent.length > 0) map[name] = recent
  }
  return map
}
