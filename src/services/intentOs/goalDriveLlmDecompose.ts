import type { Language } from '../../i18n'
import type { AIConfig } from '../aiService'
import { sendMessage } from '../aiService'
import { isAiConfigured } from '../../lib/aiPlatformMode'
import { decomposeGoalToTaskLines } from './goalDriveAutopilotService'

export type GoalDecomposeSource = 'llm' | 'heuristic'

const TASK_LINE = /^[-*]\s+(?:\[[ xX]\]\s+)?(.+)$/

/** Parse LLM output into actionable task lines (JSON array or markdown bullets). */
export function parseLlmGoalTaskLines(raw: string): string[] | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const jsonStart = trimmed.indexOf('[')
  const jsonEnd = trimmed.lastIndexOf(']')
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown
      if (Array.isArray(parsed)) {
        const tasks = parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length >= 4 && item.length <= 200)
        if (tasks.length >= 2) return tasks.slice(0, 8)
      }
    } catch {
      // fall through to bullet parsing
    }
  }

  const tasks: string[] = []
  const seen = new Set<string>()
  for (const line of trimmed.split(/\r?\n/)) {
    const match = line.trim().match(TASK_LINE)
    const text = match?.[1]?.trim() ?? ''
    if (!text || text.length < 4) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tasks.push(text)
  }
  return tasks.length >= 2 ? tasks.slice(0, 8) : null
}

export function buildGoalDecomposeMessages(goal: string, locale: Language) {
  const isEn = locale === 'en-US'
  const system = isEn
    ? 'You decompose product goals into 3–6 concrete engineering tasks for a spec tasks.md checklist. Reply with ONLY a JSON array of strings, no markdown fences.'
    : '将产品目标分解为 3–6 条可执行的工程任务，用于 spec tasks.md 清单。仅回复 JSON 字符串数组，不要 markdown 代码块。'
  const user = isEn
    ? `Goal:\n${goal.trim()}\n\nReturn JSON like ["Task one", "Task two"]`
    : `目标：\n${goal.trim()}\n\n返回形如 ["任务一", "任务二"] 的 JSON`
  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
}

/** Phase 10 F4 — LLM goal decomposition with heuristic fallback. */
export async function decomposeGoalForLinkage(
  goal: string,
  locale: Language,
  aiConfig: AIConfig,
  loggedIn: boolean,
): Promise<{ tasks: string[]; source: GoalDecomposeSource }> {
  const fallback = () => ({
    tasks: decomposeGoalToTaskLines(goal, locale),
    source: 'heuristic' as const,
  })

  if (!isAiConfigured(aiConfig, loggedIn)) return fallback()

  try {
    const content = await sendMessage(aiConfig, buildGoalDecomposeMessages(goal, locale), undefined, {
      loggedIn,
    })
    const parsed = parseLlmGoalTaskLines(content)
    if (parsed?.length) return { tasks: parsed, source: 'llm' }
  } catch {
    // quota / network — fall back silently
  }

  return fallback()
}
