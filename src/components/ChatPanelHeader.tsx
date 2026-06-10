import type { AIConfig, QuotaCheck } from '../services/aiService'
import type { IndexBuildState } from '../services/projectIndexManager'
import type { IndexBuildStats } from '../services/projectIndexService'
import { QuotaIndicator } from './ui/QuotaIndicator'
import {
  Bot,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  ListTodo,
  Zap,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { projectIndexManager } from '../services/projectIndexManager'

export interface ChatPanelHeaderProps {
  aiConfig: AIConfig
  quota: QuotaCheck
  planDisplayName: string
  isConfigured: boolean
  needsPlatformSignIn: boolean
  controlsExpanded: boolean
  onToggleControlsExpanded: () => void
  planMode: boolean
  onTogglePlanMode: () => void
  useWorkspaceContext: boolean
  onToggleWorkspaceContext: () => void
  workspaceSelectedCount: number
  embeddedInRightPanel?: boolean
  indexStats: IndexBuildStats
  indexBuildState: IndexBuildState
  editorFiles: { name: string; content: string; language: string }[]
}

export function ChatPanelHeader({
  aiConfig,
  quota,
  planDisplayName,
  isConfigured,
  needsPlatformSignIn,
  controlsExpanded,
  onToggleControlsExpanded,
  planMode,
  onTogglePlanMode,
  useWorkspaceContext,
  onToggleWorkspaceContext,
  workspaceSelectedCount,
  embeddedInRightPanel = false,
  indexStats,
  indexBuildState,
  editorFiles,
}: ChatPanelHeaderProps) {
  const { t } = useI18n()

  return (
    <div
      className={`chat-panel-header chat-panel-header--dense ${embeddedInRightPanel ? 'chat-panel-header--embedded' : ''}`}
    >
      <div className="chat-header-grid">
        <div className="chat-header-grid__meta">
          <div className="chat-control-strip__chips" title={t('chat.sessionTitle')}>
            <span
              className="chat-chip chat-chip--model chat-chip--model-combo"
              title={`${aiConfig.provider}${aiConfig.model ? ` / ${aiConfig.model}` : ''}`}
            >
              {aiConfig.model ? `${aiConfig.provider} · ${aiConfig.model}` : aiConfig.provider}
            </span>
            <span
              className={`chat-chip ${isConfigured ? 'chat-chip--success' : 'chat-chip--warning'}`}
              title={
                isConfigured
                  ? t('chat.configured')
                  : needsPlatformSignIn
                    ? t('chat.pendingPlatformSignIn')
                    : t('chat.pendingConfig')
              }
            >
              {isConfigured
                ? t('chat.configuredShort')
                : needsPlatformSignIn
                  ? t('chat.pendingPlatformSignInShort')
                  : t('chat.pendingConfigShort')}
            </span>
          </div>

          <QuotaIndicator quota={quota} inline planDisplayName={planDisplayName} />

          <button
            type="button"
            className="chat-controls-toggle"
            onClick={onToggleControlsExpanded}
            aria-expanded={controlsExpanded}
            title={controlsExpanded ? t('chat.controlsCollapse') : t('chat.controlsExpand')}
          >
            {controlsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="chat-mode-segment" role="group" aria-label={t('chat.modesGroup')}>
          <button
            type="button"
            className="chat-mode-segment__btn chat-mode-segment__btn--active"
            title={t('chat.agentModeTitle')}
            aria-pressed="true"
          >
            <Zap size={13} aria-hidden />
            <span>{t('chat.agent')}</span>
          </button>

          <button
            type="button"
            onClick={onTogglePlanMode}
            className={`chat-mode-segment__btn ${planMode ? 'chat-mode-segment__btn--active' : ''}`}
            title={planMode ? t('chat.planModeOn') : t('chat.planModeOff')}
            aria-pressed={planMode}
          >
            <ListTodo size={13} aria-hidden />
            <span>{t('chat.planShort')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleWorkspaceContext}
            disabled={workspaceSelectedCount === 0}
            className={`chat-mode-segment__btn ${useWorkspaceContext ? 'chat-mode-segment__btn--active' : ''}`}
            title={
              workspaceSelectedCount === 0
                ? t('chat.workspaceEmpty')
                : t('chat.workspaceSelected', { count: workspaceSelectedCount })
            }
            aria-pressed={useWorkspaceContext}
          >
            <FolderOpen size={13} aria-hidden />
            <span>
              {t('chat.workspaceShort')}
              {workspaceSelectedCount > 0 ? ` (${workspaceSelectedCount})` : ''}
            </span>
            {useWorkspaceContext ? (
              <CheckSquare size={11} className="chat-mode-segment__badge" aria-hidden />
            ) : null}
          </button>
        </div>
      </div>

      {controlsExpanded ? (
        <div className="chat-panel-header__details">
          {!embeddedInRightPanel ? (
            <div className="chat-session-card__title chat-session-card__title--inline">
              <Bot size={14} color="var(--accent-color)" />
              <strong>{t('chat.sessionTitle')}</strong>
            </div>
          ) : null}
          {(indexStats.indexedFiles > 0 ||
            indexBuildState.status === 'building' ||
            indexBuildState.status === 'error') && (
            <p className="chat-index-hint" title={t('chat.indexHintTitle')}>
              {indexBuildState.status === 'building' ? (
                indexBuildState.progress
                  ? t('chat.indexBuildingProgress', {
                      indexed: indexBuildState.progress.indexed,
                      total: indexBuildState.progress.total,
                    })
                  : t('chat.indexBuilding')
              ) : indexBuildState.status === 'error' ? (
                <>
                  {t('chat.indexError', { message: indexBuildState.lastError ?? '' })}{' '}
                  <button
                    type="button"
                    className="chat-index-retry"
                    onClick={() => {
                      projectIndexManager.forceRebuildFromWorkspace(
                        editorFiles.map((f) => ({
                          name: f.name,
                          content: f.content,
                          language: f.language,
                        })),
                      )
                    }}
                  >
                    {t('chat.indexRetry')}
                  </button>
                </>
              ) : indexStats.capped ? (
                t('chat.indexCapped', {
                  indexed: indexStats.indexedFiles,
                  eligible: indexStats.eligibleFiles,
                })
              ) : (
                t('chat.indexOk', { count: indexStats.indexedFiles })
              )}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
