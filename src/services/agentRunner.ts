import type { AIConfig } from './aiService'
import type { AgentFileChange } from './agentApplyService'
import { AGENT_TOOL_DEFINITIONS } from './agentTools/definitions'
import { executeAgentTool } from './agentTools/executor'
import type { AgentToolName } from './agentTools/types'
import { sendChatCompletion } from './agentChatCompletion'
import type { ChatMessage } from './agentChatTypes'
import { loadAgentSettings } from './agentSettingsService'
import { sanitizeChatAssistantOutput } from './chatOutputSanitizer'
import { detectLanguageFromPath } from './projectIndexService'
import { normalizeProjectPath } from './localProjectPaths'
import { countDiffHunks } from './diffHunkService'
import { workspaceContextService } from './workspaceContextService'
import {
  AGENT_SUMMARY_NUDGE,
  AGENT_TOOLS_SYSTEM,
  isRepeatedToolCall,
  needsAgentFinalSummary,
  toolCallSignature,
} from './agentPromptShared'

export type AgentActivityEntry = {
  round: number
  tool: AgentToolName
  detail: string
  ok: boolean
  /** Set when write_file is staged for Diff preview (autoApplyWrites off). */
  hunkCount?: number
  /** Tool output was clipped at MAX_TOOL_OUTPUT. */
  truncated?: boolean
}

export type AgentRunCallbacks = {
  onActivity?: (entry: AgentActivityEntry) => void
  onAssistantText?: (text: string) => void
  shouldStop?: () => boolean
  signal?: AbortSignal
}

export type AgentRunResult = {
  finalContent: string
  activity: AgentActivityEntry[]
  pendingChanges: AgentFileChange[]
  rounds: number
}

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function activityDetail(name: AgentToolName, args: Record<string, unknown>): string {
  switch (name) {
    case 'read_file':
      return String(args.path ?? '')
    case 'write_file':
      return String(args.path ?? '')
    case 'search_repo':
      return String(args.query ?? '')
    case 'grep_repo':
      return String(args.pattern ?? args.query ?? '').slice(0, 80)
    case 'run_command':
      return String(args.command ?? '').slice(0, 120)
    case 'list_files':
      return typeof args.glob === 'string' ? args.glob : '(all)'
    default:
      return ''
  }
}

function toPendingChange(path: string, content: string): AgentFileChange | null {
  const normalized = normalizeProjectPath(path)
  if (!normalized) return null
  return {
    path: normalized,
    content,
    language: detectLanguageFromPath(normalized),
  }
}

export async function runAgentLoop(
  config: AIConfig,
  initialMessages: ChatMessage[],
  callbacks?: AgentRunCallbacks,
): Promise<AgentRunResult> {
  const settings = await loadAgentSettings()
  const maxRounds = settings.maxRounds
  const applyWrites = settings.autoApplyWrites

  const messages: ChatMessage[] = [...initialMessages]
  const activity: AgentActivityEntry[] = []
  const pendingChanges: AgentFileChange[] = []
  const pendingPaths = new Set<string>()
  let finalContent = ''
  let rounds = 0
  let lastToolSignature: string | null = null
  let repeatToolCount = 0
  let stopToolsForSummary = false

  for (let round = 0; round < maxRounds; round++) {
    if (stopToolsForSummary) break
    if (callbacks?.shouldStop?.() || callbacks?.signal?.aborted) {
      break
    }
    rounds = round + 1
    const completion = await sendChatCompletion(config, messages, {
      tools: AGENT_TOOL_DEFINITIONS,
      signal: callbacks?.signal,
    })

    if (completion.content?.trim()) {
      finalContent = sanitizeChatAssistantOutput(completion.content)
      callbacks?.onAssistantText?.(finalContent)
    }

    const toolCalls = completion.tool_calls
    if (!toolCalls?.length) {
      break
    }

    messages.push({
      role: 'assistant',
      content: completion.content,
      tool_calls: toolCalls,
      reasoning_content: completion.reasoning_content ?? null,
    })

    for (const call of toolCalls) {
      if (callbacks?.shouldStop?.() || callbacks?.signal?.aborted) {
        break
      }
      const name = call.function.name as AgentToolName
      const args = parseToolArguments(call.function.arguments)
      const result = await executeAgentTool(
        { name, arguments: args },
        { applyWrites: name === 'write_file' ? applyWrites : true },
      )

      const entry: AgentActivityEntry = {
        round: rounds,
        tool: name,
        detail: activityDetail(name, args),
        ok: result.ok,
        truncated: result.truncated,
      }
      activity.push(entry)
      callbacks?.onActivity?.(entry)

      if (name === 'write_file' && result.stagedWrite && !applyWrites) {
        const change = toPendingChange(result.stagedWrite.path, result.stagedWrite.content)
        if (change && !pendingPaths.has(change.path)) {
          pendingPaths.add(change.path)
          pendingChanges.push(change)
          const prior = workspaceContextService.getFile(change.path)?.content ?? ''
          entry.hunkCount = countDiffHunks(prior, change.content)
        }
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result.ok ? result.output : `[tool failed] ${result.error ?? result.output}`,
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

  if (needsAgentFinalSummary(activity.length, finalContent)) {
    const summary = await requestAgentFinalSummary(config, messages, callbacks?.signal)
    if (summary) {
      finalContent = sanitizeChatAssistantOutput(summary)
      callbacks?.onAssistantText?.(finalContent)
    }
  }

  return { finalContent, activity, pendingChanges, rounds }
}

async function requestAgentFinalSummary(
  config: AIConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  messages.push({ role: 'user', content: AGENT_SUMMARY_NUDGE })
  const completion = await sendChatCompletion(config, messages, {
    signal,
    tools: [],
  })
  return completion.content?.trim() ?? ''
}

export function buildAgentToolMessages(
  workspaceSummary: string,
  userGoal: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `${AGENT_TOOLS_SYSTEM}\n\nWorkspace:\n${workspaceSummary}`,
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userGoal },
  ]
}

export function formatActivityForChat(
  activity: AgentActivityEntry[],
  label: (tool: AgentToolName, detail: string, ok: boolean) => string,
): string {
  if (activity.length === 0) return ''
  return activity.map((a) => label(a.tool, a.detail, a.ok)).join('\n')
}
