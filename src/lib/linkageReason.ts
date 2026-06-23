/** Phase 10 — causal keys for autopilot / linkage decisions. */
export const LINKAGE_REASON_IDS = [
  'open-tasks',
  'no-open-tasks',
  'git-clean',
  'git-dirty',
  'queue-idle',
  'queue-busy',
  'grounding-ok',
  'grounding-blocked',
  'background-available',
  'background-unavailable',
  'goal-decomposed',
  'spec-created',
  'spec-reused',
  'foreground-preferred',
  'quota-blocked',
  'drift-warn',
] as const

export type LinkageReasonId = (typeof LINKAGE_REASON_IDS)[number]

export interface LinkageReason {
  id: LinkageReasonId
  detail?: string
}

export function isLinkageReasonId(value: string): value is LinkageReasonId {
  return (LINKAGE_REASON_IDS as readonly string[]).includes(value)
}

export function serializeLinkageReasons(reasons: LinkageReason[]): string {
  return reasons
    .map((r) => (r.detail ? `${r.id}:${r.detail.slice(0, 48)}` : r.id))
    .join('|')
}

export function parseLinkageReasons(raw: string | undefined): LinkageReason[] {
  if (!raw?.trim()) return []
  return raw.split('|').map((segment) => {
    const [id, ...rest] = segment.split(':')
    const detail = rest.join(':').trim()
    if (!isLinkageReasonId(id)) return null
    return detail ? { id, detail } : { id }
  }).filter((r): r is LinkageReason => r !== null)
}

export type LinkageReasonLabelKey =
  | 'linkage.reason.openTasks'
  | 'linkage.reason.noOpenTasks'
  | 'linkage.reason.gitClean'
  | 'linkage.reason.gitDirty'
  | 'linkage.reason.queueIdle'
  | 'linkage.reason.queueBusy'
  | 'linkage.reason.groundingOk'
  | 'linkage.reason.groundingBlocked'
  | 'linkage.reason.backgroundAvailable'
  | 'linkage.reason.backgroundUnavailable'
  | 'linkage.reason.goalDecomposed'
  | 'linkage.reason.specCreated'
  | 'linkage.reason.specReused'
  | 'linkage.reason.foregroundPreferred'
  | 'linkage.reason.quotaBlocked'
  | 'linkage.reason.driftWarn'

export function linkageReasonLabelKey(id: LinkageReasonId): LinkageReasonLabelKey {
  const map: Record<LinkageReasonId, LinkageReasonLabelKey> = {
    'open-tasks': 'linkage.reason.openTasks',
    'no-open-tasks': 'linkage.reason.noOpenTasks',
    'git-clean': 'linkage.reason.gitClean',
    'git-dirty': 'linkage.reason.gitDirty',
    'queue-idle': 'linkage.reason.queueIdle',
    'queue-busy': 'linkage.reason.queueBusy',
    'grounding-ok': 'linkage.reason.groundingOk',
    'grounding-blocked': 'linkage.reason.groundingBlocked',
    'background-available': 'linkage.reason.backgroundAvailable',
    'background-unavailable': 'linkage.reason.backgroundUnavailable',
    'goal-decomposed': 'linkage.reason.goalDecomposed',
    'spec-created': 'linkage.reason.specCreated',
    'spec-reused': 'linkage.reason.specReused',
    'foreground-preferred': 'linkage.reason.foregroundPreferred',
    'quota-blocked': 'linkage.reason.quotaBlocked',
    'drift-warn': 'linkage.reason.driftWarn',
  }
  return map[id]
}

export function appendBecauseToMeta(
  meta: Record<string, string | number | boolean> | undefined,
  reasons: LinkageReason[],
): Record<string, string | number | boolean> {
  if (reasons.length === 0) return meta ?? {}
  return { ...meta, because: serializeLinkageReasons(reasons) }
}
