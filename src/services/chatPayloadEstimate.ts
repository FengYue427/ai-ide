import type { Language } from '../i18n'
import { appendAgentContextSections } from './agentContextService'
import { DEFAULT_AGENT_SETTINGS } from './agentSettingsService'
import { aiAgentService } from './aiAgentService'
import type { AIModel } from './aiService'
import { buildChatHistory, type ChatHistoryMessage } from './chatHistory'
import { buildMentionContextSection } from './mentionContextService'
import { getPayloadBudget, getPayloadBudgetLevel, type PayloadBudgetLevel } from './payloadBudget'
import type { ProjectIndex } from './projectIndexService'
import { workspaceContextService } from './workspaceContextService'

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
}

export interface ChatPayloadEstimate {
  estimatedBytes: number
  budgetBytes: number
  level: PayloadBudgetLevel
  usagePercent: number
}

export function measureAiMessagesPayload(
  messages: { role: string; content: string }[],
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

  const estimatedBytes = measureAiMessagesPayload(aiMessages)
  const budgetBytes = getPayloadBudget(input.provider)
  const level = getPayloadBudgetLevel(estimatedBytes, budgetBytes)
  const usagePercent =
    budgetBytes > 0 ? Math.min(100, Math.round((estimatedBytes / budgetBytes) * 100)) : 0

  return { estimatedBytes, budgetBytes, level, usagePercent }
}
