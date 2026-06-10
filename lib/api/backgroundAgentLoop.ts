import type { BackgroundAgentAiConfig } from './backgroundAgentConfig'
import { resolveBackgroundAgentMaxRounds } from './backgroundAgentConfig'
import type { BackgroundAgentChatMessage } from './backgroundAgentChat'
import { sendBackgroundAgentCompletion } from './backgroundAgentChat'
import type { BackgroundAgentWorkspace } from './backgroundAgentWorkspace'
import {
  executeBackgroundAgentTool,
  type BackgroundAgentToolName,
} from './backgroundAgentTools'
import {
  AGENT_BACKGROUND_SYSTEM,
  AGENT_SUMMARY_NUDGE,
  isRepeatedToolCall,
  needsAgentFinalSummary,
  toolCallSignature,
} from '../../src/services/agentPromptShared'

export type BackgroundAgentLoopCallbacks = {
  onRound?: (round: number) => void | Promise<void>
  shouldStop?: () => boolean | Promise<boolean>
}

export type BackgroundAgentLoopResult = {
  finalContent: string
  rounds: number
  toolCalls: number
}

const AGENT_SYSTEM = AGENT_BACKGROUND_SYSTEM

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function buildBackgroundAgentMessages(
  workspace: BackgroundAgentWorkspace,
  userGoal: string,
): BackgroundAgentChatMessage[] {
  return [
    {
      role: 'system',
      content: `${AGENT_SYSTEM}\n\nWorkspace:\n${workspace.summarize()}`,
    },
    { role: 'user', content: userGoal },
  ]
}

export async function runBackgroundAgentLoop(
  userId: string,
  config: BackgroundAgentAiConfig,
  workspace: BackgroundAgentWorkspace,
  userGoal: string,
  callbacks?: BackgroundAgentLoopCallbacks,
): Promise<BackgroundAgentLoopResult> {
  const messages: BackgroundAgentChatMessage[] = buildBackgroundAgentMessages(workspace, userGoal)
  const maxRounds = resolveBackgroundAgentMaxRounds()
  let finalContent = ''
  let rounds = 0
  let toolCalls = 0
  let lastToolSignature: string | null = null
  let repeatToolCount = 0
  let stopToolsForSummary = false

  for (let round = 0; round < maxRounds; round++) {
    if (stopToolsForSummary) break
    if (await callbacks?.shouldStop?.()) break

    rounds = round + 1
    await callbacks?.onRound?.(rounds)

    const completion = await sendBackgroundAgentCompletion(userId, config, messages)

    if (completion.content?.trim()) {
      finalContent = completion.content
    }

    const calls = completion.tool_calls
    if (!calls?.length) break

    messages.push({
      role: 'assistant',
      content: completion.content,
      tool_calls: calls,
      reasoning_content: completion.reasoning_content ?? null,
    })

    for (const call of calls) {
      if (await callbacks?.shouldStop?.()) break
      const name = call.function.name as BackgroundAgentToolName
      const args = parseToolArguments(call.function.arguments)
      const result = executeBackgroundAgentTool(workspace, name, args)
      toolCalls++

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result.ok ? result.output : `ERROR: ${result.error ?? result.output}`,
      })

      const signature = toolCallSignature(name, args)
      const repeat = isRepeatedToolCall(signature, lastToolSignature, repeatToolCount)
      lastToolSignature = signature
      repeatToolCount = repeat.nextCount
      if (repeat.repeated) {
        stopToolsForSummary = true
        break
      }
    }

    if (completion.finish_reason === 'stop' && !completion.tool_calls?.length) {
      break
    }
  }

  if (needsAgentFinalSummary(toolCalls, finalContent)) {
    messages.push({ role: 'user', content: AGENT_SUMMARY_NUDGE })
    const summaryCompletion = await sendBackgroundAgentCompletion(userId, config, messages, {
      tools: [],
    })
    if (summaryCompletion.content?.trim()) {
      finalContent = summaryCompletion.content
    }
  }

  return { finalContent, rounds, toolCalls }
}
