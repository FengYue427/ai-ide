/** Conservative MCP catalog reserve when tool count is unknown (v1.2.8). */
export const CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES = 6_000

/** @deprecated Use estimateMcpPayloadReserveBytes — kept for parity tests. */
export const CHAT_PAYLOAD_MCP_RESERVE_BYTES = CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES

export const CHAT_PAYLOAD_MCP_RESERVE_BASE_BYTES = 2_000
export const CHAT_PAYLOAD_MCP_RESERVE_PER_TOOL_BYTES = 250
export const CHAT_PAYLOAD_MCP_RESERVE_MAX_BYTES = 12_000

/** Dynamic MCP payload headroom from cached tool count (v1.2.9 F2). */
export function estimateMcpPayloadReserveBytes(toolCount?: number): number {
  if (toolCount == null || toolCount <= 0) {
    return CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES
  }
  const raw =
    CHAT_PAYLOAD_MCP_RESERVE_BASE_BYTES + toolCount * CHAT_PAYLOAD_MCP_RESERVE_PER_TOOL_BYTES
  return Math.min(raw, CHAT_PAYLOAD_MCP_RESERVE_MAX_BYTES)
}
