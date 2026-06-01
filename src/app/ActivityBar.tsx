import type { ReactNode } from 'react'
import {
  Bot,
  Eye,
  FolderTree,
  GitBranch,
  Play,
  Search,
  Server,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { useIDEStore } from '../store/ideStore'

export type ActivityId = 'files' | 'search' | 'ai' | 'git' | 'run' | 'preview'

interface ActivityBarProps {
  showFileSidebar: boolean
  onToggleFileSidebar: () => void
  onOpenSearch: () => void
  onOpenChat: () => void
  onOpenBackgroundJobs?: () => void
  onToggleGit: () => void
  onRunCode: () => void
  onOpenPreview: () => void
  isRunning: boolean
  isReady: boolean
}

export function ActivityBar({
  showFileSidebar,
  onToggleFileSidebar,
  onOpenSearch,
  onOpenChat,
  onOpenBackgroundJobs,
  onToggleGit,
  onRunCode,
  onOpenPreview,
  isRunning,
  isReady,
}: ActivityBarProps) {
  const { t } = useI18n()
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const backgroundJobsActiveCount = useIDEStore((s) => s.backgroundJobsActiveCount)
  const backgroundAgentOn = isBackgroundAgentEnabled()

  const item = (id: ActivityId, active: boolean, onClick: () => void, icon: ReactNode, label: string, primary = false) => (
    <button
      key={id}
      type="button"
      className={`activity-bar__btn ${active ? 'activity-bar__btn--active' : ''} ${primary ? 'activity-bar__btn--primary' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={id === 'run' && (isRunning || !isReady)}
    >
      {icon}
    </button>
  )

  return (
    <nav className="activity-bar" aria-label={t('activityBar.label')}>
      {item('files', showFileSidebar, onToggleFileSidebar, <FolderTree size={20} />, t('activityBar.files'))}
      {item('search', showSearchPanel, onOpenSearch, <Search size={20} />, t('activityBar.search'))}
      {item('ai', showChatPanel, onOpenChat, <Bot size={20} />, t('activityBar.ai'))}
      {backgroundAgentOn && onOpenBackgroundJobs ? (
        <button
          type="button"
          className="activity-bar__btn"
          onClick={onOpenBackgroundJobs}
          title={t('toolbar.backgroundJobs')}
          aria-label={t('toolbar.backgroundJobs')}
        >
          <Server size={18} />
          {backgroundJobsActiveCount > 0 ? (
            <span className="activity-bar__badge" aria-hidden>
              {backgroundJobsActiveCount > 9 ? '9+' : backgroundJobsActiveCount}
            </span>
          ) : null}
        </button>
      ) : null}
      {item('git', showGitPanel, onToggleGit, <GitBranch size={20} />, t('activityBar.git'))}
      <div className="activity-bar__spacer" />
      {item('run', false, onRunCode, <Play size={20} />, isRunning ? t('toolbar.running') : t('toolbar.run'), true)}
      {item('preview', showPreview, onOpenPreview, <Eye size={20} />, t('activityBar.preview'))}
    </nav>
  )
}
