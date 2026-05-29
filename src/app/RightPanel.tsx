import { GitBranch, MessageSquare, Server, X } from 'lucide-react'
import { ChatPanel, GitPanel } from './lazyPanels'
import BackgroundJobsPanel from '../components/BackgroundJobsPanel'
import { applyChangesToFiles, applyChangesToWorkspace } from '../services/fileApplyService'
import { applyGitSyncToFiles, applyGitSyncToWorkspace } from './gitEditorSync'
import { projectIndexManager } from '../services/projectIndexManager'
import type { GitFileSyncUpdate } from '../services/gitService'
import { useI18n } from '../i18n'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
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
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setDiffContent = useIDEStore((s) => s.setDiffContent)
  const setShowDiff = useIDEStore((s) => s.setShowDiff)

  const backgroundAgentOn = isBackgroundAgentEnabled()
  const currentFile = files[activeFile]

  if (!showGitPanel && !showChatPanel) {
    return null
  }

  const panelWidth = showGitPanel ? '380px' : backgroundAgentOn ? '400px' : '340px'

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
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="right-panel"
      style={{ width: panelWidth, display: 'flex', flexDirection: 'column' }}
    >
      {showGitPanel ? (
        <>
          <div
            className="panel-header panel-header-strong"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitBranch size={14} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>Git</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                  {t('panel.git.subtitle')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseGit}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
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
              onShowDiff={(oldContent, newContent) => {
                setDiffContent({ old: oldContent, new: newContent })
                setShowDiff(true)
              }}
              notify={notify}
            />
          </div>
        </>
      ) : (
        <>
          <div
            className="panel-header panel-header-strong"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {rightPanelView === 'backgroundJobs' && backgroundAgentOn ? (
                <Server size={14} />
              ) : (
                <MessageSquare size={14} />
              )}
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {rightPanelView === 'backgroundJobs' && backgroundAgentOn
                    ? t('panel.backgroundJobs.title')
                    : t('panel.chat.title')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                  {rightPanelView === 'backgroundJobs' && backgroundAgentOn
                    ? t('panel.backgroundJobs.subtitle')
                    : t('panel.chat.subtitle')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseChat}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
          {renderChatTabs()}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {backgroundAgentOn && rightPanelView === 'backgroundJobs' ? (
              <BackgroundJobsPanel
                notify={notify}
                isLoggedIn={!!currentUser}
                onRequestLogin={onOpenAuth}
                onOpenSubscription={onOpenSubscription}
              />
            ) : (
              <ChatPanel
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
    </div>
  )
}
