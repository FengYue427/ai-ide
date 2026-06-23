import type { Language } from '../i18n'
import { appendAgentContextSections } from './agentContextService'
import { DEFAULT_AGENT_SETTINGS } from './agentSettingsService'
import { aiAgentService } from './aiAgentService'
import type { AIModel } from './aiService'
import { buildChatHistory, type ChatHistoryMessage } from './chatHistory'
import { buildMentionContextSection } from './mentionContextService'
import { estimateMcpPayloadReserveBytes } from './mcpPayloadReserve'
import { getPayloadBudget, getPayloadBudgetLevel, type PayloadBudgetLevel } from './payloadBudget'
import type { ProjectIndex } from './projectIndexService'
import { workspaceContextService } from './workspaceContextService'

/** Conservative allowance when semantic retrieval may run on send (v1.2.7 F2). */
export const CHAT_PAYLOAD_SEMANTIC_RESERVE_BYTES = 8_000

/** Conservative allowance per agent tool-loop send (v1.2.7 F2). */
export const CHAT_PAYLOAD_AGENT_TOOL_LOOP_RESERVE_BYTES = 16_000

export {
  CHAT_PAYLOAD_MCP_RESERVE_BYTES,
  CHAT_PAYLOAD_MCP_RESERVE_FALLBACK_BYTES,
} from './mcpPayloadReserve'

export interface ChatPayloadEstimateInput {
  draftText: string
  messages: ChatHistoryMessage[]
  provider: AIModel
  language: Language
  agentMode: boolean
  useWorkspaceContext: boolean
  workspaceSelectedFiles: number
  currentCode: string
  editorFiles: { name: string; content: string }[]
  index: ProjectIndex
  activeFilePath: string | null
  applyProjectRules: (prompt: string) => string
  defaultSystemPrompt: string
  historyLimit?: number
  /** Sync estimate: semantic search likely on send */
  semanticSearchEnabled?: boolean
  /** Sync estimate: agent tool loop likely on send */
  agentToolLoopEnabled?: boolean
  /** Sync estimate: enabled MCP servers may append tools section */
  mcpToolsEnabled?: boolean
  /** Cached MCP tool count for dynamic reserve (v1.2.9 F2) */
  mcpToolCount?: number
}

export interface ChatPayloadEstimate {
  estimatedBytes: number
  budgetBytes: number
  level: PayloadBudgetLevel
  usagePercent: number
  /** Included in estimatedBytes — for meter footnotes */
  semanticReserveBytes?: number
  toolLoopReserveBytes?: number
  mcpReserveBytes?: number
}

export function measureAiMessagesPayload(
  messages: Array<{ role: string; content: string | import('../lib/chatAttachments').ChatContentPart[] }>,
): number {
  return new Blob([JSON.stringify(messages)]).size
}

/** Synchronous payload estimate for chat composer meter (excludes async semantic/MCP). */
export function estimateChatPayload(input: ChatPayloadEstimateInput): ChatPayloadEstimate {
  const historyLimit = input.historyLimit ?? 20
  const userText = input.draftText.trim() || ' '
  const history = buildChatHistory(input.messages, historyLimit)

  let systemPrompt = input.defaultSystemPrompt
  if (input.useWorkspaceContext && input.workspaceSelectedFiles > 0) {
    systemPrompt = workspaceContextService.generateSystemPrompt('', input.language)
  }

  systemPrompt = input.applyProjectRules(systemPrompt)
  systemPrompt = appendAgentContextSections(systemPrompt, {
    language: input.language,
    activeFilePath: input.activeFilePath,
    agentSettings: DEFAULT_AGENT_SETTINGS,
  })

  const mentionSection = buildMentionContextSection(
    input.draftText,
    input.editorFiles,
    input.index,
    input.language,
  )
  if (mentionSection) {
    systemPrompt = `${systemPrompt}\n\n${mentionSection}`
  }

  const aiMessages = input.agentMode
    ? aiAgentService.buildMessages(userText, systemPrompt, history)
    : [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        { role: 'user' as const, content: userText },
      ]

  let estimatedBytes = measureAiMessagesPayload(aiMessages)
  let semanticReserveBytes = 0
  let toolLoopReserveBytes = 0
  let mcpReserveBytes = 0

  if (input.semanticSearchEnabled && input.useWorkspaceContext) {
    semanticReserveBytes = CHAT_PAYLOAD_SEMANTIC_RESERVE_BYTES
    estimatedBytes += semanticReserveBytes
  }
  if (input.agentToolLoopEnabled) {
    toolLoopReserveBytes = CHAT_PAYLOAD_AGENT_TOOL_LOOP_RESERVE_BYTES
    estimatedBytes += toolLoopReserveBytes
  }
  if (input.mcpToolsEnabled) {
    mcpReserveBytes = estimateMcpPayloadReserveBytes(input.mcpToolCount)
    estimatedBytes += mcpReserveBytes
  }

  const budgetBytes = getPayloadBudget(input.provider)
  const level = getPayloadBudgetLevel(estimatedBytes, budgetBytes)
  const usagePercent =
    budgetBytes > 0 ? Math.min(100, Math.round((estimatedBytes / budgetBytes) * 100)) : 0

  return {
    estimatedBytes,
    budgetBytes,
    level,
    usagePercent,
    semanticReserveBytes: semanticReserveBytes || undefined,
    toolLoopReserveBytes: toolLoopReserveBytes || undefined,
    mcpReserveBytes: mcpReserveBytes || undefined,
  }
}
