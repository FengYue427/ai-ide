import type { ReactNode } from 'react'
import { GitBranch, MessageSquare, Server, X } from 'lucide-react'
import { ChatPanel, GitPanel } from './lazyPanels'
import BackgroundJobsPanel from '../components/BackgroundJobsPanel'
import { applyChangesToFiles, applyChangesToWorkspace } from '../services/fileApplyService'
import { applyGitSyncToFiles, applyGitSyncToWorkspace } from './gitEditorSync'
import { projectIndexManager } from '../services/projectIndexManager'
import type { GitFileSyncUpdate } from '../services/gitService'
import { useI18n } from '../i18n'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { useIDEStore, type RightPanelView } from '../store/ideStore'
import type { WebContainer } from '@webcontainer/api'
import type { ToastKind } from '../components/FeedbackCenter'

interface RightPanelProps {
  fs: typeof WebContainer.prototype.fs | null
  notify: (kind: ToastKind, title: string, detail?: string) => void
  onCloseGit: () => void
  onCloseChat: () => void
  onOpenAuth?: () => void
  onOpenSubscription?: () => void
}

function PanelChrome({
  icon,
  title,
  subtitle,
  onClose,
  closeLabel,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClose: () => void
  closeLabel: string
}) {
  return (
    <div className="panel-header-compact">
      <div className="panel-header-compact__main">
        {icon}
        <div>
          <div className="panel-header-compact__title">{title}</div>
          <div className="panel-header-compact__subtitle">{subtitle}</div>
        </div>
      </div>
      <button type="button" className="panel-close-btn" onClick={onClose} aria-label={closeLabel}>
        <X size={14} />
      </button>
    </div>
  )
}

export function RightPanel({
  fs,
  notify,
  onCloseGit,
  onCloseChat,
  onOpenAuth,
  onOpenSubscription,
}: RightPanelProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const currentUser = useIDEStore((s) => s.currentUser)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const rightPanelView = useIDEStore((s) => s.rightPanelView)
  const backgroundJobsActiveCount = useIDEStore((s) => s.backgroundJobsActiveCount)
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const setFiles = useIDEStore((s) => s.setFiles)
  const openGitDiffTab = useIDEStore((s) => s.openGitDiffTab)

  const backgroundAgentOn = isBackgroundAgentEnabled()
  const currentFile = files[activeFile]
  const gitReadOnly = Boolean(collaborationRoomId && !collabRoleCanWrite(collaborationMemberRole))

  if (!showGitPanel && !showChatPanel) {
    return null
  }

  const panelClass = showGitPanel
    ? 'right-panel right-panel--git'
    : backgroundAgentOn
      ? 'right-panel right-panel--chat-wide'
      : 'right-panel right-panel--chat'

  const renderChatTabs = () => {
    if (!backgroundAgentOn) return null
    const tabs: { id: RightPanelView; label: string }[] = [
      { id: 'chat', label: t('panel.chat.title') },
      { id: 'backgroundJobs', label: t('panel.backgroundJobs.title') },
    ]
    return (
      <div className="right-panel-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={rightPanelView === tab.id}
            className={`right-panel-tab ${rightPanelView === tab.id ? 'right-panel-tab--active' : ''}`}
            onClick={() => setRightPanelView(tab.id)}
          >
            <span className="right-panel-tab__label">{tab.label}</span>
            {tab.id === 'backgroundJobs' && backgroundJobsActiveCount > 0 ? (
              <span className="right-panel-tab__badge" aria-hidden>
                {backgroundJobsActiveCount > 9 ? '9+' : backgroundJobsActiveCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    )
  }

  return (
    <aside className={panelClass}>
      {showGitPanel ? (
        <>
          <PanelChrome
            icon={<GitBranch size={16} />}
            title="Git"
            subtitle={t('panel.git.subtitle')}
            onClose={onCloseGit}
            closeLabel={t('panel.close')}
          />
          <div className="right-panel__body">
            <GitPanel
              fs={fs}
              files={files}
              onFilesChange={() => {
                projectIndexManager.rebuildFromWorkspace(files)
              }}
              onEditorSync={(updates: GitFileSyncUpdate[]) => {
                setFiles((prev) => applyGitSyncToFiles(prev, updates))
                void applyGitSyncToWorkspace(updates)
              }}
              onOpenGitDiffTab={(payload) => {
                let tabLabel = t('git.diffTabLabel', { path: payload.path })
                if (payload.diffSource === 'staged') {
                  tabLabel = t('git.stagedDiffTabLabel', { path: payload.path })
                } else if (payload.diffSource === 'commit') {
                  tabLabel = t('git.commitDiffTabLabel', {
                    path: payload.path,
                    sha: payload.commitOid?.slice(0, 7) ?? '',
                  })
                }
                openGitDiffTab({
                  ...payload,
                  diffSource: payload.diffSource ?? 'workdir',
                  tabLabel,
                })
              }}
              readOnly={gitReadOnly}
              notify={notify}
            />
          </div>
        </>
      ) : (
        <>
          <PanelChrome
            icon={
              rightPanelView === 'backgroundJobs' && backgroundAgentOn ? (
                <Server size={16} />
              ) : (
                <MessageSquare size={16} />
              )
            }
            title={
              rightPanelView === 'backgroundJobs' && backgroundAgentOn
                ? t('panel.backgroundJobs.title')
                : t('panel.chat.title')
            }
            subtitle={
              rightPanelView === 'backgroundJobs' && backgroundAgentOn
                ? t('panel.backgroundJobs.subtitle')
                : t('panel.chat.subtitle')
            }
            onClose={onCloseChat}
            closeLabel={t('panel.close')}
          />
          {renderChatTabs()}
          <div className="right-panel__body">
            {backgroundAgentOn && rightPanelView === 'backgroundJobs' ? (
              <BackgroundJobsPanel
                notify={notify}
                isLoggedIn={!!currentUser}
                onRequestLogin={onOpenAuth}
                onOpenSubscription={onOpenSubscription}
              />
            ) : (
              <ChatPanel
                embeddedInRightPanel
                aiConfig={aiConfig}
                currentCode={currentFile?.content || ''}
                notify={notify}
                onGenerateFiles={(newFiles: { name: string; content: string; language: string }[]) => {
                  const payload = newFiles.map((file) => ({
                    path: file.name,
                    content: file.content,
                    language: file.language,
                  }))
                  setFiles((prev) => applyChangesToFiles(prev, payload))
                  void applyChangesToWorkspace(payload)
                }}
              />
            )}
          </div>
        </>
      )}
    </aside>
  )
}
