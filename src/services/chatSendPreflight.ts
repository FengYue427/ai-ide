import type { ChatPayloadEstimate } from './chatPayloadEstimate'
import { getPayloadBudgetLevel, type PayloadBudgetLevel } from './payloadBudget'
import { countUnresolvedMentions, type MentionPreflightResult } from './mentionPreflight'

/** Conservative headroom for async semantic search / MCP tools not in sync meter. */
export const CHAT_PAYLOAD_METER_RESERVE_BYTES = 12_000

export const CHAT_PAYLOAD_SEND_PARITY_TOLERANCE = 0.2

export interface ChatSendMentionGate {
  blocked: boolean
  unresolvedCount: number
}

export function evaluateSendMentionGate(
  mentionCheck: MentionPreflightResult,
  forceSlim: boolean,
): ChatSendMentionGate {
  const unresolvedCount = countUnresolvedMentions(mentionCheck)
  return {
    unresolvedCount,
    blocked: unresolvedCount > 0 && !forceSlim,
  }
}

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
