import React from 'react'
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  CircleDot,
  GitBranch,
  Globe,
  Monitor,
  Radio,
  Save,
  Settings2,
  Shield,
  Sparkles,
  Zap,
  CheckSquare,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { collabRoleLabel } from '../lib/collabPermissions'
import { normalizeLanguage } from '../lib/language'
import { getPlatformSurface, resolveRuntimeStatusKind } from '../lib/platformParity'
import { resolveIcpBeian } from '../lib/deployContext'
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
  specCount?: number
  specOpenTaskCount?: number
  onOpenSpecStudio?: () => void
  onRunFirstSpecTask?: () => void
  onOpenIntentGraph?: () => void
  onRunAutopilotNext?: () => void
  autopilotTaskPreview?: string | null
  autopilotOpenCount?: number
  /** Intent Shell 开启时隐藏重复的 Spec/Autopilot/Graph 入口 */
  intentShellActive?: boolean
}

const pillClass = (extra = '') => ['status-pill', extra].filter(Boolean).join(' ')

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
  specCount = 0,
  specOpenTaskCount = 0,
  onOpenSpecStudio,
  onRunFirstSpecTask,
  onOpenIntentGraph,
  onRunAutopilotNext,
  autopilotTaskPreview,
  autopilotOpenCount = 0,
  intentShellActive = false,
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
      java: 'Java',
      cpp: 'C++',
      go: 'Go',
      rust: 'Rust',
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

  const platformSurface = getPlatformSurface()
  const runtimeKind = resolveRuntimeStatusKind(isWebContainerReady)
  const runtimeReady = runtimeKind === 'desktopReady' || runtimeKind === 'webReady'
  const runtimeLabel =
    runtimeKind === 'desktopReady'
      ? t('platform.runtime.desktopReady')
      : runtimeKind === 'webReady'
        ? t('status.runtime.ready')
        : runtimeKind === 'desktopIdle'
          ? t('platform.runtime.desktopIdle')
          : t('status.runtime.loading')

  const diagnosticTone =
    diagnosticErrors > 0
      ? 'status-pill--danger'
      : diagnosticWarnings > 0
        ? 'status-pill--warning'
        : 'status-pill--success'

  const icpBeian = resolveIcpBeian()

  return (
    <div className="app-status-bar">
      <div className="app-status-bar__cluster">
        <div className={pillClass('status-pill--ghost status-pill--filename')}>
          {isModified ? (
            <CircleDot size={12} color="var(--warning-color)" />
          ) : (
            <CheckCircle2 size={12} color="var(--success-color)" />
          )}
          <span>{currentFileName}</span>
        </div>

        <div className={pillClass()}>
          <Sparkles size={12} />
          <span>{getLanguageLabel()}</span>
        </div>

        <div className={pillClass()}>
          <span>{t('editor.meta.lines', { count: lineCount })}</span>
          <span>·</span>
          <span>{t('editor.meta.chars', { count: charCount })}</span>
        </div>

        <div className={pillClass(diagnosticTone)}>
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

        {showPerformanceHint ? (
          <div
            className={`${pillClass('status-pill--warning')} status-pill--hide-narrow`}
            title={t('status.performance.hint')}
          >
            <Activity size={12} />
            <span>{t('status.performance.hint')}</span>
          </div>
        ) : null}

        {activeFeatures.codeReview ? (
          <div className={pillClass('status-pill--accent')}>
            <Shield size={12} />
            <span>{t('status.feature.review')}</span>
          </div>
        ) : null}

        {activeFeatures.performance ? (
          <div className={pillClass('status-pill--success')}>
            <Activity size={12} />
            <span>{t('status.feature.performance')}</span>
          </div>
        ) : null}

        {collaborationRoomId && collaborationMemberRole ? (
          <div className={pillClass('status-pill--accent')} data-testid="collab-role-badge">
            <span>{collabRoleLabel(collaborationMemberRole, t)}</span>
          </div>
        ) : null}

        {collaborationRoomId && signalingMode ? (
          <div
            className={pillClass()}
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

      <div className="app-status-bar__cluster">
        <div
          className={pillClass('status-pill--platform')}
          data-testid="status-platform-surface"
          title={t('platform.parity.desc')}
        >
          {platformSurface === 'desktop' ? <Monitor size={12} /> : <Globe size={12} />}
          <span>
            {platformSurface === 'desktop' ? t('status.platform.desktop') : t('status.platform.browser')}
          </span>
        </div>

        <div
          className={pillClass(runtimeReady ? 'status-pill--success' : 'status-pill--warning')}
          data-testid="status-runtime-ready"
          title={runtimeLabel}
        >
          <Zap size={12} />
          <span>{runtimeLabel}</span>
        </div>

        <button
          type="button"
          onClick={onToggleAutoSave}
          className={pillClass(`status-pill--action ${autoSaveEnabled ? 'status-pill--success' : ''}`)}
          title={t('status.autosaveTitle')}
        >
          <Save size={12} />
          <span>{autoSaveEnabled ? t('status.autosave.on') : t('status.autosave.off')}</span>
        </button>

        {specCount > 0 && onOpenSpecStudio ? (
          <>
            <button
              type="button"
              onClick={onOpenSpecStudio}
              className={pillClass('status-pill--action status-pill--accent')}
              data-testid="status-spec-studio"
              title={t('status.spec.studioTitle')}
            >
              <Sparkles size={12} />
              <span>{t('status.spec.count', { count: specCount, open: specOpenTaskCount })}</span>
            </button>
            {specOpenTaskCount > 0 && onRunFirstSpecTask && !intentShellActive ? (
              <button
                type="button"
                onClick={onRunFirstSpecTask}
                className={pillClass('status-pill--action status-pill--success')}
                data-testid="status-spec-run"
                title={t('status.spec.runTitle')}
              >
                <CheckSquare size={12} />
                <span>{t('status.spec.run')}</span>
              </button>
            ) : null}
            {onRunAutopilotNext && autopilotTaskPreview && !intentShellActive ? (
              <button
                type="button"
                onClick={onRunAutopilotNext}
                className={pillClass('status-pill--action status-pill--accent')}
                data-testid="status-autopilot-next"
                title={autopilotTaskPreview}
              >
                <Sparkles size={12} />
                <span>
                  {autopilotOpenCount > 1
                    ? t('intent.autopilot.runNextWithCount', { count: autopilotOpenCount })
                    : t('intent.autopilot.runNext')}
                </span>
              </button>
            ) : null}
            {onOpenIntentGraph && !intentShellActive ? (
              <button
                type="button"
                onClick={onOpenIntentGraph}
                className={pillClass('status-pill--action')}
                data-testid="status-intent-graph"
                title={t('intent.graph.openTitle')}
              >
                <GitBranch size={12} />
                <span>{t('intent.graph.openShort')}</span>
              </button>
            ) : null}
          </>
        ) : null}

        {gitBranch ? (
          <>
            <button
              type="button"
              onClick={onOpenGitPanel}
              className={pillClass(
                `status-pill--action ${gitModified > 0 ? 'status-pill--warning' : ''}`,
              )}
              title={t('status.gitTitle')}
            >
              <span>{gitBranch}</span>
              {gitModified > 0 ? <span>({gitModified})</span> : null}
            </button>
            {gitUnstaged > 0 && onStageAll ? (
              <button
                type="button"
                onClick={onStageAll}
                disabled={gitStageAllDisabled}
                className={pillClass(
                  `status-pill--action ${gitStageAllDisabled ? '' : 'status-pill--success'}`,
                )}
                style={{
                  opacity: gitStageAllDisabled ? 0.55 : 1,
                  cursor: gitStageAllDisabled ? 'not-allowed' : 'pointer',
                }}
                title={t('git.stageAllTitle')}
              >
                <span>{t('git.stageAll')}</span>
              </button>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          onClick={onOpenAISettings}
          className={pillClass(`status-pill--action ${isAIConnected ? 'status-pill--accent' : ''}`)}
          title={t('status.aiTitle')}
        >
          <Bot size={12} />
          <span>{isAIConnected ? (aiProvider ?? t('status.ai.connected')) : t('status.ai.configure')}</span>
          {isAIConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        </button>

        <div className={`${pillClass()} status-pill--hide-narrow`}>
          <Globe size={12} />
          <span>{localeLabel}</span>
        </div>

        {icpBeian ? (
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className={`${pillClass()} status-pill--icp`}
          >
            {icpBeian}
          </a>
        ) : null}

        <button type="button" onClick={onOpenSettings} className={pillClass('status-pill--action')} title={t('status.settingsTitle')}>
          <Settings2 size={12} />
          <span>{t('status.settings')}</span>
        </button>
      </div>
    </div>
  )
}

export default StatusBar
