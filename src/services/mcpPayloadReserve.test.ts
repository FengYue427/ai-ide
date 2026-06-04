import { describe, expect, it } from 'vitest'
import {
  CHAT_PAYLOAD_MCP_RESERVE_BASE_BYTES,
  CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES,
  CHAT_PAYLOAD_MCP_RESERVE_MAX_BYTES,
  CHAT_PAYLOAD_MCP_RESERVE_PER_TOOL_BYTES,
  estimateMcpPayloadReserveBytes,
} from './mcpPayloadReserve'

describe('estimateMcpPayloadReserveBytes', () => {
  it('uses fallback when tool count is unknown or zero', () => {
    expect(estimateMcpPayloadReserveBytes()).toBe(CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES)
    expect(estimateMcpPayloadReserveBytes(0)).toBe(CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES)
  })

  it('scales linearly with tool count and caps at max', () => {
    expect(estimateMcpPayloadReserveBytes(4)).toBe(
      CHAT_PAYLOAD_MCP_RESERVE_BASE_BYTES + 4 * CHAT_PAYLOAD_MCP_RESERVE_PER_TOOL_BYTES,
    )
    expect(estimateMcpPayloadReserveBytes(999)).toBe(CHAT_PAYLOAD_MCP_RESERVE_MAX_BYTES)
  })
})
