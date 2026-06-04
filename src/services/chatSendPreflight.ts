import type { ChatPayloadEstimate } from './chatPayloadEstimate'
import { getPayloadBudgetLevel, type PayloadBudgetLevel } from './payloadBudget'
import {
  countAmbiguousMentions,
  countUnresolvedMentions,
  type MentionPreflightResult,
} from './mentionPreflight'

/** Conservative headroom for async semantic search / MCP tools not in sync meter. */
export const CHAT_PAYLOAD_METER_RESERVE_BYTES = 12_000

export const CHAT_PAYLOAD_SEND_PARITY_TOLERANCE = 0.2

export interface ChatSendMentionGate {
  blocked: boolean
  unresolvedCount: number
  ambiguousCount: number
  blockReason: 'unresolved' | 'ambiguous' | null
}

export function evaluateSendMentionGate(
  mentionCheck: MentionPreflightResult,
  forceSlim: boolean,
): ChatSendMentionGate {
  const unresolvedCount = countUnresolvedMentions(mentionCheck)
  const ambiguousCount = countAmbiguousMentions(mentionCheck)
  if (forceSlim) {
    return { unresolvedCount, ambiguousCount, blocked: false, blockReason: null }
  }
  if (unresolvedCount > 0) {
    return { unresolvedCount, ambiguousCount, blocked: true, blockReason: 'unresolved' }
  }
  if (ambiguousCount > 0) {
    return { unresolvedCount, ambiguousCount, blocked: true, blockReason: 'ambiguous' }
  }
  return { unresolvedCount, ambiguousCount, blocked: false, blockReason: null }
}

/** Base async/MCP headroom on top of sync estimate (v1.2.6). */
export function applyPayloadMeterReserve(estimate: ChatPayloadEstimate): ChatPayloadEstimate {
  const estimatedBytes = estimate.estimatedBytes + CHAT_PAYLOAD_METER_RESERVE_BYTES
  const level: PayloadBudgetLevel = getPayloadBudgetLevel(estimatedBytes, estimate.budgetBytes)
  const usagePercent =
    estimate.budgetBytes > 0
      ? Math.min(100, Math.round((estimatedBytes / estimate.budgetBytes) * 100))
      : 0
  return { ...estimate, estimatedBytes, level, usagePercent }
}

export function comparePayloadEstimateToSend(
  meterBytes: number,
  sendBytes: number,
  toleranceRatio = CHAT_PAYLOAD_SEND_PARITY_TOLERANCE,
): { withinTolerance: boolean; deltaBytes: number; deltaRatio: number } {
  const deltaBytes = sendBytes - meterBytes
  const base = Math.max(meterBytes, 1)
  const deltaRatio = deltaBytes / base
  const withinTolerance = Math.abs(deltaRatio) <= toleranceRatio
  return { withinTolerance, deltaBytes, deltaRatio }
}
