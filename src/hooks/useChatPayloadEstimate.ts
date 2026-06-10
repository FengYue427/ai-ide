import { useEffect, useMemo, useState } from 'react'
import { getEnabledMcpServers, getMcpServersSync, getMcpToolCountEstimateSync, loadMcpServers, refreshMcpToolCountEstimate } from '../services/mcpConfigService'
import { supportsAgentToolCalling } from '../services/agentChatCompletion'
import { DEFAULT_AGENT_SETTINGS } from '../services/agentSettingsService'
import { estimateChatPayload } from '../services/chatPayloadEstimate'
import { applyPayloadMeterReserve } from '../services/chatSendPreflight'
import { getLargeRepoContextHint, shouldShowLargeRepoHint } from '../services/largeRepoContextHint'
import { runMentionPreflight } from '../services/mentionPreflight'
import { canUseEmbeddings } from '../services/embeddingService'
import { isSemanticSearchEnabled } from '../lib/semanticSearchPrefs'
import { projectIndexManager } from '../services/projectIndexManager'
import type { IndexBuildStats } from '../services/projectIndexService'
import type { AIConfig } from '../services/aiService'
import type { FileItem } from '../types/file'
import type { Language, TranslateFn } from '../i18n'

export interface UseChatPayloadEstimateParams {
  aiConfig: AIConfig
  isConfigured: boolean
  input: string
  messagesLength: number
  chatHistoryMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  agentMode: boolean
  planMode: boolean
  useWorkspaceContext: boolean
  workspaceSelectedFiles: number
  currentCode: string
  editorFiles: FileItem[]
  indexVersion: number
  indexStats: IndexBuildStats
  activeFilePath: string | null
  applyProjectRules: (prompt: string) => string
  language: Language
  t: TranslateFn
}

export function useChatPayloadEstimate({
  aiConfig,
  isConfigured,
  input,
  messagesLength,
  chatHistoryMessages,
  agentMode,
  planMode,
  useWorkspaceContext,
  workspaceSelectedFiles,
  currentCode,
  editorFiles,
  indexVersion,
  indexStats,
  activeFilePath,
  applyProjectRules,
  language,
  t,
}: UseChatPayloadEstimateParams) {
  const [mcpToolsEnabled, setMcpToolsEnabled] = useState(
    () => getMcpServersSync().filter((s) => s.enabled && s.url.trim()).length > 0,
  )
  const [mcpToolCount, setMcpToolCount] = useState<number | undefined>(() =>
    getMcpToolCountEstimateSync(),
  )

  useEffect(() => {
    let cancelled = false
    void loadMcpServers().then(() =>
      getEnabledMcpServers().then((servers) => {
        if (!cancelled) setMcpToolsEnabled(servers.length > 0)
      }),
    )
    void refreshMcpToolCountEstimate().then((count) => {
      if (!cancelled) setMcpToolCount(count > 0 ? count : undefined)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const payloadEstimate = useMemo(() => {
    if (!isConfigured) return null
    const hasDraft = Boolean(input.trim())
    const hasSession = messagesLength > 2
    if (!hasDraft && !useWorkspaceContext && !hasSession) return null

    const semanticSearchEnabled =
      useWorkspaceContext && isSemanticSearchEnabled() && canUseEmbeddings(aiConfig)
    const agentToolLoopEnabled =
      agentMode &&
      !planMode &&
      DEFAULT_AGENT_SETTINGS.useToolLoop &&
      supportsAgentToolCalling(aiConfig.provider)
    const mcpReserveOn = agentMode && mcpToolsEnabled

    return estimateChatPayload({
      draftText: input,
      messages: chatHistoryMessages,
      provider: aiConfig.provider,
      language,
      agentMode,
      useWorkspaceContext,
      workspaceSelectedFiles,
      currentCode,
      editorFiles,
      index: projectIndexManager.getIndex(),
      activeFilePath,
      applyProjectRules,
      defaultSystemPrompt: t('chat.system.default', { code: currentCode }),
      semanticSearchEnabled,
      agentToolLoopEnabled,
      mcpToolsEnabled: mcpReserveOn,
      mcpToolCount: mcpReserveOn ? mcpToolCount : undefined,
    })
  }, [
    agentMode,
    mcpToolsEnabled,
    mcpToolCount,
    aiConfig.apiKey,
    aiConfig.provider,
    applyProjectRules,
    chatHistoryMessages,
    currentCode,
    editorFiles,
    indexVersion,
    input,
    isConfigured,
    language,
    messagesLength,
    t,
    useWorkspaceContext,
    workspaceSelectedFiles,
    activeFilePath,
    planMode,
  ])

  const payloadMeterEstimate = useMemo(
    () => (payloadEstimate ? applyPayloadMeterReserve(payloadEstimate) : null),
    [payloadEstimate],
  )

  const mentionPreflight = useMemo(() => {
    if (!input.includes('@')) return null
    return runMentionPreflight(input, editorFiles, projectIndexManager.getIndex())
  }, [editorFiles, indexVersion, input])

  const largeRepoHint = useMemo(() => getLargeRepoContextHint(indexStats), [indexStats])

  const showLargeRepoHint = useMemo(
    () =>
      shouldShowLargeRepoHint(largeRepoHint, {
        useWorkspaceContext,
        mentionTokenCount: mentionPreflight?.tokens.length ?? 0,
      }),
    [largeRepoHint, mentionPreflight?.tokens.length, useWorkspaceContext],
  )

  return {
    payloadEstimate,
    payloadMeterEstimate,
    mentionPreflight,
    largeRepoHint,
    showLargeRepoHint,
  }
}
