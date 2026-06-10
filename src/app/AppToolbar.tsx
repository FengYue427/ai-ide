import {
  Activity,
  BarChart2,
  Command,
  FolderOpen,
  Home,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { resolveAppLogo } from '../lib/appOrigin'
import { useI18n } from '../i18n'
import { usePublicWelfare } from '../hooks/usePublicWelfare'
import { authService } from '../services/authService'
import { useIDEStore } from '../store/ideStore'
import { getWorkspaceLimitSnapshot } from '../services/workspaceLimits'
import { preferCnBillingCheckout } from '../../lib/billing/billingRegion'
import { findPlanByName, formatPlanPrice } from '../../lib/billing/plans'
import type { ConfirmRequest, ToastKind } from '../components/FeedbackCenter'

interface AppToolbarProps {
  isRunning: boolean
  runtimeError: Error | null
  runStatusText: string
  onOpenWorkspace: () => void
  onOpenCommandPalette: () => void
  onOpenSettings: () => void
  onOpenWelcome: () => void
  onOpenAuth: () => void
  onOpenSubscription: () => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  notify: (kind: ToastKind, title: string, detail?: string) => void
}

export function AppToolbar({
  isRunning,
  runtimeError,
  runStatusText,
  onOpenWorkspace,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenWelcome,
  onOpenAuth,
  onOpenSubscription,
  requestConfirm,
  notify,
}: AppToolbarProps) {
  const { t, language } = useI18n()
  const logoUrl = resolveAppLogo()
  const publicWelfare = usePublicWelfare()
  const preferCny = preferCnBillingCheckout(language)
  const files = useIDEStore((s) => s.files)
  const fileLimit = getWorkspaceLimitSnapshot(files.length)
  const currentUser = useIDEStore((s) => s.currentUser)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const setCurrentUser = useIDEStore((s) => s.setCurrentUser)
  const pluginToolbarButtons = useIDEStore((s) => s.pluginToolbarButtons)
  const proPlan = findPlanByName('pro')
  const proStartingPrice = proPlan
    ? formatPlanPrice(proPlan, { preferCny })
    : preferCny
      ? '¥39'
      : '$9.99'

  const renderPluginIcon = (icon: string) => {
    if (icon === 'bar-chart') return <BarChart2 size={14} />
    if (icon === 'sparkles') return <Sparkles size={14} />
    return <Sparkles size={14} />
  }

  return (
    <header className="toolbar toolbar--compact">
      <div className="toolbar-brand toolbar-brand--compact">
        <div className="toolbar-brand-mark">
          <img src={logoUrl} alt="" width={32} height={32} decoding="async" />
        </div>
        <div className="toolbar-brand-text">
          <span className="toolbar-title">{t('app.name')}</span>
          <span className="toolbar-subtitle">{t('app.tagline')}</span>
        </div>
      </div>

      <div className="toolbar-actions toolbar-actions--secondary">
        <button type="button" onClick={onOpenWorkspace} title={t('toolbar.workspace')}>
          <FolderOpen size={14} />
          <span className="toolbar-btn-label">{t('toolbar.workspace')}</span>
        </button>
        {pluginToolbarButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={button.onClick}
            title={t('toolbar.plugin', { label: button.label })}
          >
            {renderPluginIcon(button.icon)}
            <span className="toolbar-btn-label">{button.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-meta">
        <div className={`toolbar-chip ${isRunning || runtimeError ? 'toolbar-chip-running' : ''}`} title={runStatusText}>
          <Activity size={14} />
          <span className="toolbar-chip-text">{runStatusText}</span>
        </div>
        <div
          className={`toolbar-chip ${fileLimit.tier === 'warn' ? 'toolbar-chip--warn' : ''} ${fileLimit.tier === 'full' ? 'toolbar-chip--danger' : ''}`}
          title={t('toolbar.fileCountHint', { current: fileLimit.current, max: fileLimit.max })}
        >
          <Save size={14} />
          <span className="toolbar-chip-text">
            <strong>{fileLimit.current}</strong>
            <span className="toolbar-chip-muted"> / {fileLimit.max}</span>
          </span>
        </div>
      </div>

      {currentUser ? (
        <button
          type="button"
          className="toolbar-user-btn"
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
        >
          <User size={14} />
          <span className="toolbar-btn-label">{currentUser.name || currentUser.email.split('@')[0]}</span>
        </button>
      ) : (
        <button type="button" className="toolbar-user-btn" onClick={onOpenAuth}>
          <User size={14} />
          <span className="toolbar-btn-label">{t('toolbar.login')}</span>
        </button>
      )}

      {!publicWelfare && currentPlan !== 'enterprise' ? (
        <button type="button" onClick={onOpenSubscription} className="toolbar-upgrade-btn">
          <Zap size={14} />
          <span className="toolbar-btn-label">
            {!currentUser
              ? t('toolbar.plans.guest')
              : currentPlan === 'free'
                ? t('toolbar.plans.upgrade', { price: proStartingPrice })
                : t('toolbar.plans.team')}
          </span>
        </button>
      ) : null}
      {publicWelfare ? (
        <span className="toolbar-welfare-badge" title={t('toolbar.welfare.title')}>
          {t('toolbar.welfare.badge')}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="toolbar-cmd-btn"
        title={t('toolbar.commandPalette')}
        aria-label={t('toolbar.commandPalette')}
      >
        <Command size={14} />
        <kbd className="toolbar-kbd">Ctrl+Shift+P</kbd>
      </button>

      <button
        type="button"
        onClick={onOpenWelcome}
        className="toolbar-ghost-icon"
        title={t('toolbar.welcome')}
        aria-label={t('toolbar.welcome')}
      >
        <Home size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        className="toolbar-ghost-icon"
        title={t('toolbar.settings')}
        aria-label={t('toolbar.settings')}
      >
        <SettingsIcon size={18} />
      </button>

      <span className="toolbar-version">
        {`v${(import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || 'dev'}`}
      </span>
    </header>
  )
}
