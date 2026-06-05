import type { ChatPayloadEstimate } from './chatPayloadEstimate'
import { measureAiMessagesPayload } from './chatPayloadEstimate'
import { getPayloadBudget } from './payloadBudget'
import { getPayloadWarningData, type PayloadWarningData } from './chatPayloadPreflight'
import type { ChatSendMentionGate } from './chatSendPreflight'
import type { AIModel } from './aiService'

export type AgentSendPreflightBlockReason =
  | 'mention_unresolved'
  | 'mention_ambiguous'
  | 'payload_over_budget'
  | null

export interface AgentSendPreflightResult {
  blocked: boolean
  blockReason: AgentSendPreflightBlockReason
  mentionGate: ChatSendMentionGate
  payloadWarning: PayloadWarningData | null
}

export type AgentSlimPlanTranslator = (
  key: 'chat.payload.planHistory' | 'chat.payload.planInput' | 'chat.payload.planWorkspace' | 'chat.payload.planMention' | 'chat.preflight.indexTrimmed',
  params?: Record<string, string | number>,
) => string

export function buildAgentSendSlimPlan(
  t: AgentSlimPlanTranslator,
  historyLimit: number,
  options?: { agentMode?: boolean },
): string[] {
  const plan = [
    t('chat.payload.planHistory', { count: historyLimit }),
    t('chat.payload.planInput', { count: 1200 }),
    t('chat.payload.planWorkspace'),
    t('chat.payload.planMention'),
  ]
  if (options?.agentMode) {
    plan.push(t('chat.preflight.indexTrimmed'))
  }
  return plan
}

export function evaluateMeterPayloadPreflight(args: {
  meterEstimate: ChatPayloadEstimate | null
  draftText: string
  slimPlan: string[]
  forceSlim: boolean
}): PayloadWarningData | null {
  if (args.forceSlim || !args.meterEstimate) return null
  return getPayloadWarningData(
    args.meterEstimate.estimatedBytes,
    args.meterEstimate.budgetBytes,
    args.draftText,
    args.slimPlan,
  )
}

export function evaluateBuiltMessagesPreflight(args: {
  messages: { role: string; content: string | null }[]
  provider: AIModel
  draftText: string
  slimPlan: string[]
  forceSlim: boolean
}): PayloadWarningData | null {
  if (args.forceSlim) return null
  const normalized = args.messages.map((message) => ({
    role: message.role,
    content: message.content ?? '',
  }))
  const estimatedBytes = measureAiMessagesPayload(normalized)
  const budgetBytes = getPayloadBudget(args.provider)
  return getPayloadWarningData(estimatedBytes, budgetBytes, args.draftText, args.slimPlan)
}

/** v1.3.7 — aggregate mention gate + meter payload preflight before Agent/Chat send. */
export function evaluateAgentSendPreflight(args: {
  mentionGate: ChatSendMentionGate
  meterEstimate: ChatPayloadEstimate | null
  draftText: string
  slimPlan: string[]
  forceSlim: boolean
}): AgentSendPreflightResult {
  if (args.mentionGate.blocked) {
    return {
      blocked: true,
      blockReason:
        args.mentionGate.blockReason === 'ambiguous' ? 'mention_ambiguous' : 'mention_unresolved',
      mentionGate: args.mentionGate,
      payloadWarning: null,
    }
  }

  const payloadWarning = evaluateMeterPayloadPreflight({
    meterEstimate: args.meterEstimate,
    draftText: args.draftText,
    slimPlan: args.slimPlan,
    forceSlim: args.forceSlim,
  })

  if (payloadWarning) {
    return {
      blocked: true,
      blockReason: 'payload_over_budget',
      mentionGate: args.mentionGate,
      payloadWarning,
    }
  }

  return {
    blocked: false,
    blockReason: null,
    mentionGate: args.mentionGate,
    payloadWarning: null,
  }
}
