import type { BackgroundAgentAiConfig } from './backgroundAgentConfig'
import { resolveBackgroundAgentMaxRounds } from './backgroundAgentConfig'
import type { BackgroundAgentChatMessage } from './backgroundAgentChat'
import { sendBackgroundAgentCompletion } from './backgroundAgentChat'
import type { BackgroundAgentWorkspace } from './backgroundAgentWorkspace'
import {
  executeBackgroundAgentTool,
  type BackgroundAgentToolName,
} from './backgroundAgentTools'

export type BackgroundAgentLoopCallbacks = {
  onRound?: (round: number) => void | Promise<void>
  shouldStop?: () => boolean | Promise<boolean>
}

export type BackgroundAgentLoopResult = {
  finalContent: string
  rounds: number
  toolCalls: number
}

const AGENT_SYSTEM = `You are an autonomous coding agent running as a cloud background job in AI IDE.
- Use list_files and read_file to explore before editing.
- Use search_repo for file paths; grep_repo for content search.
- Use write_file with the FULL file content for each change (not a diff).
- run_command, move_file, delete_file are NOT available in this environment.
- When done, reply briefly summarizing what you changed.`

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

  for (let round = 0; round < maxRounds; round++) {
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
    }

    if (completion.finish_reason === 'stop' && !completion.tool_calls?.length) {
      break
    }
  }

  return { finalContent, rounds, toolCalls }
}
