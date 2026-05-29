import {
  Activity,
  BarChart2,
  Bot,
  Command,
  Eye,
  FileText,
  FolderOpen,
  GitBranch,
  Home,
  Play,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { authService } from '../services/authService'
import { useIDEStore } from '../store/ideStore'
import { getWorkspaceLimitSnapshot } from '../services/workspaceLimits'
import type { ConfirmRequest, ToastKind } from '../components/FeedbackCenter'

interface AppToolbarProps {
  isReady: boolean
  isRunning: boolean
  runtimeError: Error | null
  runStatusText: string
  onRunCode: () => void
  onOpenNewFile: () => void
  onOpenSearch: () => void
  onOpenChat: () => void
  onOpenWorkspace: () => void
  onToggleGit: () => void
  onOpenPreview: () => void
  onOpenCommandPalette: () => void
  onOpenSettings: () => void
  onOpenWelcome: () => void
  onOpenAuth: () => void
  onOpenSubscription: () => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  notify: (kind: ToastKind, title: string, detail?: string) => void
}

export function AppToolbar({
  isReady,
  isRunning,
  runtimeError,
  runStatusText,
  onRunCode,
  onOpenNewFile,
  onOpenSearch,
  onOpenChat,
  onOpenWorkspace,
  onToggleGit,
  onOpenPreview,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenWelcome,
  onOpenAuth,
  onOpenSubscription,
  requestConfirm,
  notify,
}: AppToolbarProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const fileLimit = getWorkspaceLimitSnapshot(files.length)
  const currentUser = useIDEStore((s) => s.currentUser)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const pluginToolbarButtons = useIDEStore((s) => s.pluginToolbarButtons)
  const setCurrentUser = useIDEStore((s) => s.setCurrentUser)

  const renderPluginIcon = (icon: string) => {
    if (icon === 'bar-chart') return <BarChart2 size={14} />
    if (icon === 'sparkles') return <Sparkles size={14} />
    return <Sparkles size={14} />
  }

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <div className="toolbar-brand-mark">
          <img src="/logo-ai-ide.png" alt="" width={36} height={36} decoding="async" />
        </div>
        <div className="toolbar-brand-text">
          <span className="toolbar-title">{t('app.name')}</span>
          <span className="toolbar-subtitle">{t('app.tagline')}</span>
        </div>
      </div>

      <div className="toolbar-actions">
        <button onClick={onOpenNewFile}>
          <FileText size={14} />
          <span>{t('toolbar.files')}</span>
        </button>
        <button onClick={onOpenSearch}>
          <Search size={14} />
          <span>{t('toolbar.search')}</span>
        </button>
        <button onClick={onOpenChat}>
          <Bot size={14} />
          <span>{t('toolbar.ai')}</span>
        </button>
        <button onClick={onOpenWorkspace}>
          <FolderOpen size={14} />
          <span>{t('toolbar.workspace')}</span>
        </button>
        <button onClick={onToggleGit}>
          <GitBranch size={14} />
          <span>{t('toolbar.git')}</span>
        </button>
        <button onClick={onRunCode} disabled={isRunning || !isReady} className="toolbar-primary-button">
          <Play size={14} />
          <span>{isRunning ? t('toolbar.running') : t('toolbar.run')}</span>
        </button>
        <button onClick={onOpenPreview}>
          <Eye size={14} />
          <span>{t('toolbar.preview')}</span>
        </button>
        {pluginToolbarButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={button.onClick}
            title={t('toolbar.plugin', { label: button.label })}
          >
            {renderPluginIcon(button.icon)}
            <span>{button.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-meta">
        <div className={`toolbar-chip ${isRunning || runtimeError ? 'toolbar-chip-running' : ''}`}>
          <Activity size={14} />
          <span>{runStatusText}</span>
        </div>
        <div
          className={`toolbar-chip ${fileLimit.tier === 'warn' ? 'toolbar-chip--warn' : ''} ${fileLimit.tier === 'full' ? 'toolbar-chip--danger' : ''}`}
          title={t('toolbar.fileCountHint', { current: fileLimit.current, max: fileLimit.max })}
        >
          <Save size={14} />
          <span>
            {t('toolbar.fileCount')} <strong>{fileLimit.current}</strong>
            <span className="toolbar-chip-muted"> / {fileLimit.max}</span>
          </span>
        </div>
      </div>

      {currentUser ? (
        <button
          type="button"
          onClick={async () => {
            const confirmed = await requestConfirm({
              title: t('toolbar.logoutTitle'),
              message: t('toolbar.logoutMessage', { email: currentUser.email }),
              confirmText: t('toolbar.logoutConfirm'),
            })
            if (confirmed) {
              await authService.logout()
              setCurrentUser(null)
              notify('success', t('toolbar.loggedOut'))
            }
          }}
          title={currentUser.email}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
          }}
        >
          <User size={14} />
          <span>{currentUser.name || currentUser.email.split('@')[0]}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <User size={14} />
          <span>{t('toolbar.login')}</span>
        </button>
      )}

      {currentPlan !== 'enterprise' && (
        <button type="button" onClick={onOpenSubscription} className="toolbar-upgrade-btn">
          <Zap size={14} />
          <span>
            {!currentUser
              ? t('toolbar.plans.guest')
              : currentPlan === 'free'
                ? t('toolbar.plans.upgrade')
                : t('toolbar.plans.team')}
          </span>
        </button>
      )}

      <button type="button" onClick={onOpenCommandPalette}>
        <Command size={14} />
        <span>{t('toolbar.commandPalette')}</span>
        <kbd className="toolbar-kbd">Ctrl+Shift+P</kbd>
      </button>

      <button type="button" onClick={onOpenWelcome} className="toolbar-ghost-icon" title={t('toolbar.welcome')}>
        <Home size={18} />
      </button>

      <button type="button" onClick={onOpenSettings} className="toolbar-ghost-icon" title={t('toolbar.settings')}>
        <SettingsIcon size={18} />
      </button>

      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
        {`v${(import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || 'dev'}`}
      </span>
    </div>
  )
}
