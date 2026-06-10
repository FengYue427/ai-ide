import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { AgentActivityEntry } from '../services/agentRunner'
import type { AgentFileChange } from '../services/agentApplyService'
import { loadAgentRunHistory, saveAgentRunHistoryItem } from '../services/agentRunHistoryService'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import type { ChatMessage } from './useChatSendOrchestrator'

export interface UseChatAgentRunHistoryParams {
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  agentActivity: AgentActivityEntry[]
  lastRunRounds: number
  pendingAgentChanges: AgentFileChange[] | null
  setAgentActivity: Dispatch<SetStateAction<AgentActivityEntry[]>>
  setPendingAgentChanges: Dispatch<SetStateAction<AgentFileChange[] | null>>
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  t: TranslateFn
}

export function useChatAgentRunHistory({
  messages,
  setMessages,
  agentActivity,
  lastRunRounds,
  pendingAgentChanges,
  setAgentActivity,
  setPendingAgentChanges,
  notify,
  t,
}: UseChatAgentRunHistoryParams) {
  const copyMessageText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        notify?.('success', t('chat.action.copied'), t('chat.action.copyDetail'))
      } catch {
        notify?.('error', t('chat.action.copyFailed'))
      }
    },
    [notify, t],
  )

  const saveCurrentRun = useCallback(async () => {
    if (agentActivity.length === 0) return
    const summary = messages[messages.length - 1]?.content?.slice(0, 120) || 'Agent run'
    await saveAgentRunHistoryItem({
      summary,
      rounds: lastRunRounds,
      activity: agentActivity,
      pendingChanges: pendingAgentChanges ?? [],
    })
    notify?.('success', t('chat.agentRun.savedTitle'), t('chat.agentRun.savedDetail'))
  }, [agentActivity, lastRunRounds, messages, notify, pendingAgentChanges, t])

  const replayLastRun = useCallback(async () => {
    const history = await loadAgentRunHistory()
    const latest = history[0]
    if (!latest) {
      notify?.('error', t('chat.agentRun.noRecordTitle'), t('chat.agentRun.noRecordDetail'))
      return
    }
    setAgentActivity(latest.activity)
    setPendingAgentChanges(latest.pendingChanges)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: t('chat.agentRun.replayContent', {
          activity: latest.activity.length,
          rounds: latest.rounds,
        }),
      },
    ])
  }, [notify, setAgentActivity, setMessages, setPendingAgentChanges, t])

  const exportRunMarkdown = useCallback(() => {
    if (agentActivity.length === 0) return
    const lines = [
      '# Agent Run',
      '',
      `- Rounds: ${lastRunRounds}`,
      `- Activities: ${agentActivity.length}`,
      '',
      '## Activity',
      ...agentActivity.map(
        (entry, idx) => `- ${idx + 1}. [${entry.ok ? 'OK' : 'FAIL'}] ${entry.tool} - ${entry.detail}`,
      ),
    ]
    void copyMessageText(lines.join('\n'))
  }, [agentActivity, copyMessageText, lastRunRounds])

  return {
    copyMessageText,
    saveCurrentRun,
    replayLastRun,
    exportRunMarkdown,
  }
}
