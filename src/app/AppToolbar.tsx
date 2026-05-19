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
import { authService } from '../services/authService'
import { useIDEStore } from '../store/ideStore'
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
  const files = useIDEStore((s) => s.files)
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
          <span className="toolbar-title">AI IDE</span>
          <span className="toolbar-subtitle">浏览器内开发、运行与 AI 协作</span>
        </div>
      </div>

      <div className="toolbar-actions">
        <button onClick={onOpenNewFile}>
          <FileText size={14} />
          <span>文件</span>
        </button>
        <button onClick={onOpenSearch}>
          <Search size={14} />
          <span>搜索</span>
        </button>
        <button onClick={onOpenChat}>
          <Bot size={14} />
          <span>AI</span>
        </button>
        <button onClick={onOpenWorkspace}>
          <FolderOpen size={14} />
          <span>工作区管理</span>
        </button>
        <button onClick={onToggleGit}>
          <GitBranch size={14} />
          <span>Git</span>
        </button>
        <button onClick={onRunCode} disabled={isRunning || !isReady} className="toolbar-primary-button">
          <Play size={14} />
          <span>{isRunning ? '正在运行…' : '运行'}</span>
        </button>
        <button onClick={onOpenPreview}>
          <Eye size={14} />
          <span>预览</span>
        </button>
        {pluginToolbarButtons.map((button) => (
          <button key={button.id} type="button" onClick={button.onClick} title={`插件：${button.label}`}>
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
        <div className="toolbar-chip">
          <Save size={14} />
          <span>
            文件数 <strong>{files.length}</strong>
          </span>
        </div>
      </div>

      {currentUser ? (
        <button
          type="button"
          onClick={async () => {
            const confirmed = await requestConfirm({
              title: '退出登录',
              message: `当前用户：${currentUser.email}。退出后仍可继续使用本地工作区。`,
              confirmText: '退出',
            })
            if (confirmed) {
              await authService.logout()
              setCurrentUser(null)
              notify('success', '已退出登录')
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
          <span>登录</span>
        </button>
      )}

      {currentUser && currentPlan !== 'enterprise' && (
        <button
          type="button"
          onClick={onOpenSubscription}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'white',
            fontWeight: 500,
          }}
        >
          <Zap size={14} />
          <span>{currentPlan === 'free' ? '升级套餐 ¥19起' : '升级团队版'}</span>
        </button>
      )}

      <button type="button" onClick={onOpenCommandPalette}>
        <Command size={14} />
        <span>命令面板</span>
        <kbd className="toolbar-kbd">Ctrl+Shift+P</kbd>
      </button>

      <button type="button" onClick={onOpenWelcome} className="toolbar-ghost-icon" title="返回欢迎页">
        <Home size={18} />
      </button>

      <button type="button" onClick={onOpenSettings} className="toolbar-ghost-icon" title="设置">
        <SettingsIcon size={18} />
      </button>

      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>v1.0.0</span>
    </div>
  )
}
