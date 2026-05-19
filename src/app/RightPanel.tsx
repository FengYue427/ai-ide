import { GitBranch, MessageSquare, X } from 'lucide-react'
import { ChatPanel, GitPanel } from './lazyPanels'
import { applyChangesToFiles, applyChangesToWorkspace } from '../services/fileApplyService'
import { applyGitSyncToFiles, applyGitSyncToWorkspace } from './gitEditorSync'
import { projectIndexManager } from '../services/projectIndexManager'
import type { GitFileSyncUpdate } from '../services/gitService'
import { useIDEStore } from '../store/ideStore'
import type { WebContainer } from '@webcontainer/api'
import type { ToastKind } from '../components/FeedbackCenter'

interface RightPanelProps {
  fs: typeof WebContainer.prototype.fs | null
  notify: (kind: ToastKind, title: string, detail?: string) => void
  onCloseGit: () => void
  onCloseChat: () => void
}

export function RightPanel({ fs, notify, onCloseGit, onCloseChat }: RightPanelProps) {
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setDiffContent = useIDEStore((s) => s.setDiffContent)
  const setShowDiff = useIDEStore((s) => s.setShowDiff)

  const currentFile = files[activeFile]

  if (!showGitPanel && !showChatPanel) {
    return null
  }

  return (
    <div
      className="right-panel"
      style={{ width: showGitPanel ? '380px' : '340px', display: 'flex', flexDirection: 'column' }}
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
                  查看改动与提交历史
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
              <MessageSquare size={14} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>AI 助手</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                  当前文件与工作区协作
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
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel
              aiConfig={aiConfig}
              currentCode={currentFile?.content || ''}
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
          </div>
        </>
      )}
    </div>
  )
}
