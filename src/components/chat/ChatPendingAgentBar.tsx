import { memo } from 'react'
import { useI18n } from '../../i18n'
import { getOldContentForPath } from '../../services/fileApplyService'
import type { FileItem } from '../../types/file'

export interface PendingAgentChange {
  path: string
  content: string
  language: string
}

export interface ChatPendingAgentBarProps {
  changes: PendingAgentChange[]
  editorFiles: FileItem[]
  onIgnore: () => void
  onPreview: (queue: Array<{ path: string; oldContent: string; newContent: string; language: string }>) => void
  onApply: (files: Array<{ name: string; content: string; language: string }>) => void
}

export const ChatPendingAgentBar = memo(function ChatPendingAgentBar({
  changes,
  editorFiles,
  onIgnore,
  onPreview,
  onApply,
}: ChatPendingAgentBarProps) {
  const { t } = useI18n()
  if (changes.length === 0) return null

  return (
    <div className="chat-agent-bar">
      <span className="chat-agent-bar__text">
        {t('chat.agentChanges', {
          count: changes.length,
          paths: changes.map((change) => change.path).join('、'),
        })}
      </span>
      <div className="chat-agent-bar__actions">
        <button type="button" className="chat-btn-ghost" onClick={onIgnore}>
          {t('chat.ignore')}
        </button>
        <button
          type="button"
          className="chat-btn-ghost"
          onClick={() =>
            onPreview(
              changes.map((change) => ({
                path: change.path,
                oldContent: getOldContentForPath(editorFiles, change.path),
                newContent: change.content,
                language: change.language,
              })),
            )
          }
        >
          {t('chat.preview')}
        </button>
        <button
          type="button"
          className="chat-btn-primary-sm"
          onClick={() =>
            onApply(
              changes.map((change) => ({
                name: change.path,
                content: change.content,
                language: change.language,
              })),
            )
          }
        >
          {t('chat.apply')}
        </button>
      </div>
    </div>
  )
})
