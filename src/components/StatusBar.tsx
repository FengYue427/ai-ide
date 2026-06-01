import React from 'react'
import { Activity, AlertCircle, Bot, CheckCircle2, CircleDot, Globe, Radio, Save, Settings2, Shield, Sparkles, Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import { collabRoleLabel } from '../lib/collabPermissions'
import { normalizeLanguage } from '../lib/language'
import { shouldShowWorkspacePerformanceHint } from '../lib/welcomeOnboarding'
import { useCollabSignalingDisplay } from '../hooks/useCollabSignalingDisplay'
import { useIDEStore } from '../store/ideStore'

interface StatusBarProps {
  currentFileName: string
  currentFileLanguage: string
  lineCount: number
  charCount: number
  diagnosticCount?: number
  diagnosticErrors?: number
  diagnosticWarnings?: number
  isModified?: boolean
  isWebContainerReady: boolean
  gitBranch?: string
  gitModified?: number
  gitUnstaged?: number
  gitStageAllDisabled?: boolean
  aiProvider?: string
  isAIConnected?: boolean
  autoSaveEnabled: boolean
  language: string
  workspaceFileCount?: number
  activeFeatures?: {
    codeReview?: boolean
    performance?: boolean
    snippets?: boolean
  }
  onOpenGitPanel?: () => void
  onStageAll?: () => void
  onOpenAISettings?: () => void
  onToggleAutoSave?: () => void
  onOpenSettings?: () => void
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '999px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-tertiary) 88%, transparent)',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  fontWeight: 700,
  minHeight: '26px',
}

const actionButtonStyle: React.CSSProperties = {
  ...pillStyle,
  background: 'transparent',
  cursor: 'pointer',
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentFileName,
  currentFileLanguage,
  lineCount,
  charCount,
  diagnosticCount = 0,
  diagnosticErrors = 0,
  diagnosticWarnings = 0,
  isModified = false,
  isWebContainerReady,
  gitBranch,
  gitModified = 0,
  gitUnstaged = 0,
  gitStageAllDisabled = false,
  aiProvider,
  isAIConnected = false,
  autoSaveEnabled,
  language,
  workspaceFileCount = 0,
  activeFeatures = {},
  onOpenGitPanel,
  onStageAll,
  onOpenAISettings,
  onToggleAutoSave,
  onOpenSettings,
}) => {
  const { t } = useI18n()
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const storeSignalingMode = useIDEStore((s) => s.collaborationSignalingMode)
  const { signalingMode: liveSignalingMode, connStatus } = useCollabSignalingDisplay(collaborationRoomId)
  const signalingMode = liveSignalingMode ?? storeSignalingMode
  const uiLocale = normalizeLanguage(language)
  const showPerformanceHint = shouldShowWorkspacePerformanceHint(workspaceFileCount)
  const localeLabel =
    uiLocale === 'ja-JP'
      ? t('status.locale.ja')
      : uiLocale === 'en-US'
        ? t('status.locale.en')
        : t('status.locale.zh')
  const getLanguageLabel = () => {
    const map: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      markdown: 'Markdown',
      plaintext: 'Plain Text',
    }
    return map[currentFileLanguage] ?? currentFileLanguage
  }

  const signalingLabel =
    signalingMode === 'livekit'
      ? t('collab.m1.signaling.livekit')
      : signalingMode === 'yjs-webrtc'
        ? t('collab.m1.signaling.webrtc')
        : ''

  return (
    <div
      className="app-status-bar"
      style={{
        minHeight: '36px',
        borderTop: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--bg-secondary) 92%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '6px 12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ ...pillStyle, color: 'var(--text-primary)', background: 'transparent' }}>
          {isModified ? <CircleDot size={12} color="var(--warning-color)" /> : <CheckCircle2 size={12} color="var(--success-color)" />}
          <span>{currentFileName}</span>
        </div>

        <div style={pillStyle}>
          <Sparkles size={12} />
          <span>{getLanguageLabel()}</span>
        </div>

        <div style={pillStyle}>
          <span>{t('editor.meta.lines', { count: lineCount })}</span>
          <span>·</span>
          <span>{t('editor.meta.chars', { count: charCount })}</span>
        </div>

        <div
          style={{
            ...pillStyle,
            color:
              diagnosticErrors > 0
                ? 'var(--danger-color)'
                : diagnosticWarnings > 0
                  ? 'var(--warning-color)'
                  : 'var(--success-color)',
          }}
        >
          <AlertCircle size={12} />
          <span>
            {diagnosticCount > 0
              ? diagnosticErrors > 0 || diagnosticWarnings > 0
                ? t('status.diagnostics.split', {
                    errors: diagnosticErrors,
                    warnings: diagnosticWarnings,
                  })
                : t('status.diagnostics.count', { count: diagnosticCount })
              : t('status.diagnostics.none')}
          </span>
        </div>

        {showPerformanceHint && (
          <div style={{ ...pillStyle, color: 'var(--warning-color)' }} title={t('status.performance.hint')}>
            <Activity size={12} />
            <span>{t('status.performance.hint')}</span>
          </div>
        )}

        {activeFeatures.codeReview && (
          <div style={{ ...pillStyle, color: '#60a5fa' }}>
            <Shield size={12} />
            <span>{t('status.feature.review')}</span>
          </div>
        )}
        {activeFeatures.performance && (
          <div style={{ ...pillStyle, color: 'var(--success-color)' }}>
            <Activity size={12} />
            <span>{t('status.feature.performance')}</span>
          </div>
        )}

        {collaborationRoomId && collaborationMemberRole ? (
          <div style={{ ...pillStyle, color: 'var(--accent-color)' }} data-testid="collab-role-badge">
            <span>{collabRoleLabel(collaborationMemberRole, t)}</span>
          </div>
        ) : null}

        {collaborationRoomId && signalingMode ? (
          <div
            style={{ ...pillStyle, color: 'var(--text-secondary)' }}
            data-testid="collab-signaling-badge"
            title={t('collab.m1.signaling.label')}
          >
            <Radio size={12} />
            <span>{signalingLabel}</span>
            {connStatus === 'connected' ? (
              <CheckCircle2 size={12} color="var(--success-color)" />
            ) : connStatus === 'connecting' || connStatus === 'reconnecting' ? (
              <Activity size={12} color="var(--warning-color)" />
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ ...pillStyle, color: isWebContainerReady ? 'var(--success-color)' : 'var(--warning-color)' }}>
          <Zap size={12} />
          <span>{isWebContainerReady ? t('status.runtime.ready') : t('status.runtime.loading')}</span>
        </div>

        <button onClick={onToggleAutoSave} style={{ ...actionButtonStyle, color: autoSaveEnabled ? 'var(--success-color)' : 'var(--text-secondary)' }} title={t('status.autosaveTitle')}>
          <Save size={12} />
          <span>{autoSaveEnabled ? t('status.autosave.on') : t('status.autosave.off')}</span>
        </button>

        {gitBranch && (
          <>
            <button
              onClick={onOpenGitPanel}
              style={{
                ...actionButtonStyle,
                color: gitModified > 0 ? 'var(--warning-color)' : 'var(--text-secondary)',
              }}
              title={t('status.gitTitle')}
            >
              <span>{gitBranch}</span>
              {gitModified > 0 && <span>({gitModified})</span>}
            </button>
            {gitUnstaged > 0 && onStageAll ? (
              <button
                onClick={onStageAll}
                disabled={gitStageAllDisabled}
                style={{
                  ...actionButtonStyle,
                  color: gitStageAllDisabled ? 'var(--text-secondary)' : 'var(--success-color)',
                  opacity: gitStageAllDisabled ? 0.55 : 1,
                  cursor: gitStageAllDisabled ? 'not-allowed' : 'pointer',
                }}
                title={t('git.stageAllTitle')}
              >
                <span>{t('git.stageAll')}</span>
              </button>
            ) : null}
          </>
        )}

        <button onClick={onOpenAISettings} style={{ ...actionButtonStyle, color: isAIConnected ? 'var(--accent-color)' : 'var(--text-secondary)' }} title={t('status.aiTitle')}>
          <Bot size={12} />
          <span>{isAIConnected ? aiProvider ?? t('status.ai.connected') : t('status.ai.configure')}</span>
          {isAIConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        </button>

        <div style={pillStyle}>
          <Globe size={12} />
          <span>{localeLabel}</span>
        </div>

        <button onClick={onOpenSettings} style={actionButtonStyle} title={t('status.settingsTitle')}>
          <Settings2 size={12} />
          <span>{t('status.settings')}</span>
        </button>
      </div>
    </div>
  )
}

export default StatusBar
