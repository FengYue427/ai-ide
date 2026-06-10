import { memo, type RefObject } from 'react'
import { Pause, Send, Server } from 'lucide-react'
import { useI18n } from '../../i18n'
import { trackEvent } from '../../lib/observability'
import type { AIConfig } from '../../services/aiService'
import type { ChatPayloadEstimate } from '../../services/chatPayloadEstimate'
import type { LargeRepoContextHint } from '../../services/largeRepoContextHint'
import {
  countAmbiguousMentions,
  countUnresolvedMentions,
  type MentionPreflightResult,
} from '../../services/mentionPreflight'
import type { IndexBuildState } from '../../services/projectIndexManager'
import type { IndexBuildStats, IndexSearchHit } from '../../services/projectIndexService'
import { toKb } from '../../services/payloadBudget'
import { ChatPayloadBudgetMeter } from '../ChatPayloadBudgetMeter'

type SendAction = 'explain' | 'refactor' | 'fix' | 'generate'

export interface ChatPayloadWarningState {
  estimatedBytes: number
  budgetBytes: number
  text: string
  action?: SendAction
  slimPlan: string[]
}

export interface ChatInputComposerProps {
  inputRef: RefObject<HTMLTextAreaElement>
  input: string
  isConfigured: boolean
  loading: boolean
  aiConfig: AIConfig
  payloadMeterEstimate: ChatPayloadEstimate | null
  payloadEstimate: ChatPayloadEstimate | null
  showLargeRepoHint: boolean
  largeRepoHint: LargeRepoContextHint | null
  mentionPreflight: MentionPreflightResult | null
  payloadWarning: ChatPayloadWarningState | null
  activeMentionQuery: string | null
  mentionBlockedByIndexBuild: boolean
  mentionHits: IndexSearchHit[]
  mentionIndex: number
  mentionOnboardingDismissed: boolean
  indexStats: IndexBuildStats
  indexBuildState: IndexBuildState
  backgroundAgentOn: boolean
  agentMode: boolean
  planMode: boolean
  currentUser: unknown
  backgroundSubmitting: boolean
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPickMention: (hit: IndexSearchHit) => void
  onDismissMentionOnboarding: () => void
  onSend: (customInput?: string, action?: SendAction, options?: { forceSlim?: boolean }) => void
  onStop: () => void
  onBackgroundRun: () => void
}

export const ChatInputComposer = memo(function ChatInputComposer({
  inputRef,
  input,
  isConfigured,
  loading,
  aiConfig,
  payloadMeterEstimate,
  payloadEstimate,
  showLargeRepoHint,
  largeRepoHint,
  mentionPreflight,
  payloadWarning,
  activeMentionQuery,
  mentionBlockedByIndexBuild,
  mentionHits,
  mentionIndex,
  mentionOnboardingDismissed,
  indexStats,
  indexBuildState,
  backgroundAgentOn,
  agentMode,
  planMode,
  currentUser,
  backgroundSubmitting,
  onInputChange,
  onKeyDown,
  onPickMention,
  onDismissMentionOnboarding,
  onSend,
  onStop,
  onBackgroundRun,
}: ChatInputComposerProps) {
  const { t } = useI18n()

  return (
    <div className="chat-input-area chat-input-area--stacked">
      {payloadMeterEstimate ? (
        <ChatPayloadBudgetMeter
          estimatedBytes={payloadMeterEstimate.estimatedBytes}
          budgetBytes={payloadMeterEstimate.budgetBytes}
          usagePercent={payloadMeterEstimate.usagePercent}
          level={payloadMeterEstimate.level}
          footnote={[
            payloadEstimate?.semanticReserveBytes ? t('chat.payload.meterSemanticNote') : null,
            payloadEstimate?.toolLoopReserveBytes ? t('chat.payload.meterToolLoopNote') : null,
            payloadEstimate?.mcpReserveBytes ? t('chat.payload.meterMcpNote') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      ) : null}

      {showLargeRepoHint && largeRepoHint ? (
        <div className="chat-large-repo-hint" role="status">
          <strong>{t('chat.indexHintTitle')}</strong>
          {largeRepoHint.kind === 'capped'
            ? t('chat.largeRepo.capped', {
                indexed: largeRepoHint.indexedFiles,
                eligible: largeRepoHint.eligibleFiles,
              })
            : t('chat.largeRepo.nearCap', {
                indexed: largeRepoHint.indexedFiles,
                eligible: largeRepoHint.eligibleFiles,
                max: largeRepoHint.maxFiles,
              })}
        </div>
      ) : null}

      {mentionPreflight && mentionPreflight.issues.length > 0 ? (
        <div className="chat-mention-preflight" role="status">
          <strong>{t('chat.mention.preflightBannerTitle')}</strong>
          <ul>
            {mentionPreflight.issues.map((issue) => {
              if (issue.kind === 'too_many') {
                return (
                  <li key="too-many">
                    {t('chat.mention.preflightTooMany', { count: issue.count, max: issue.max })}
                  </li>
                )
              }
              if (issue.kind === 'unresolved') {
                return (
                  <li key={`unresolved-${issue.token}`}>
                    {t('chat.mention.preflightUnresolved', { tokens: issue.token })}
                  </li>
                )
              }
              return (
                <li key={`ambiguous-${issue.token}`}>
                  {t('chat.mention.preflightAmbiguous', {
                    token: issue.token,
                    paths: issue.paths.join(', '),
                  })}
                </li>
              )
            })}
          </ul>
          {countUnresolvedMentions(mentionPreflight) > 0 ? (
            <span>{t('chat.mention.preflightBlockHint')}</span>
          ) : null}
          {countAmbiguousMentions(mentionPreflight) > 0 ? (
            <span>{t('chat.mention.preflightAmbiguousBlockHint')}</span>
          ) : null}
          {countAmbiguousMentions(mentionPreflight) > 0 &&
          countUnresolvedMentions(mentionPreflight) === 0 ? (
            <button
              type="button"
              className="chat-btn-primary-sm chat-mention-preflight__retry"
              onClick={() => {
                trackEvent('chat.mention_slim_retry', {
                  ambiguousCount: countAmbiguousMentions(mentionPreflight),
                })
                onSend(input, undefined, { forceSlim: true })
              }}
            >
              {t('chat.mention.slimPastAmbiguous')}
            </button>
          ) : null}
        </div>
      ) : null}

      {payloadWarning ? (
        <div className="chat-payload-warning" role="status">
          <div className="chat-payload-warning__text">
            <strong>{t('chat.payload.preflightWarnTitle')}</strong>
            <span>
              {t('chat.payload.preflightWarnDetail', {
                estimatedKb: toKb(payloadWarning.estimatedBytes),
                budgetKb: toKb(payloadWarning.budgetBytes),
              })}
            </span>
            <span className="chat-payload-warning__plan">{payloadWarning.slimPlan.join(' · ')}</span>
          </div>
          <button
            type="button"
            className="chat-btn-primary-sm"
            onClick={() => {
              trackEvent('chat.payload_slim_retry', {
                estimatedBytes: payloadWarning.estimatedBytes,
                budgetBytes: payloadWarning.budgetBytes,
                provider: aiConfig.provider,
              })
              onSend(payloadWarning.text, payloadWarning.action, { forceSlim: true })
            }}
          >
            {t('chat.payload.slimAndSend')}
          </button>
        </div>
      ) : null}

      {activeMentionQuery !== null && mentionBlockedByIndexBuild ? (
        <div className="chat-mention-blocked" role="status">
          {t('chat.mentionBuildingBlocked')}
        </div>
      ) : null}

      {mentionHits.length > 0 ? (
        <div className="chat-mention-list">
          {mentionHits.map((hit, index) => (
            <button
              key={`${hit.type}-${hit.path}-${hit.name}-${hit.line ?? 0}`}
              type="button"
              className={`chat-mention-item ${index === mentionIndex ? 'chat-mention-item--active' : ''}`}
              onClick={() => onPickMention(hit)}
            >
              <span className="chat-mention-item__kind">{hit.type === 'symbol' ? '◎' : '📄'}</span>
              <span>{hit.type === 'symbol' ? hit.name : hit.path}</span>
              {hit.line ? (
                <span className="chat-mention-item__meta">
                  {hit.path}:{hit.line}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {activeMentionQuery !== null &&
      !mentionOnboardingDismissed &&
      indexStats.indexedFiles >= 10 &&
      mentionHits.length === 0 &&
      indexBuildState.status === 'ready' ? (
        <div className="chat-mention-onboarding">
          <div className="chat-mention-onboarding__title">{t('chat.mentionOnboardingTitle')}</div>
          <div className="chat-mention-onboarding__body">{t('chat.mentionOnboardingBody')}</div>
          <button
            type="button"
            className="btn btn-secondary chat-mention-onboarding__btn"
            onClick={onDismissMentionOnboarding}
          >
            {t('chat.mentionOnboardingDismiss')}
          </button>
        </div>
      ) : null}

      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input chat-input--composer"
          placeholder={isConfigured ? t('chat.inputPlaceholder') : t('chat.inputPlaceholderNoConfig')}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={!isConfigured || loading}
          rows={1}
        />
        {backgroundAgentOn && agentMode && !planMode && currentUser ? (
          <button
            type="button"
            className="chat-send chat-send--square"
            onClick={onBackgroundRun}
            disabled={!isConfigured || loading || backgroundSubmitting || !input.trim()}
            title={t('chat.backgroundRun.button')}
          >
            <Server size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className="chat-send chat-send--square"
          onClick={loading ? onStop : () => onSend()}
          disabled={!isConfigured || (!loading && !input.trim())}
          title={loading ? t('chat.stop') : t('chat.sendButton')}
        >
          {loading ? <Pause size={16} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
})
