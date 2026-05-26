import React, { useMemo, type CSSProperties } from 'react'
import {
  ArrowRight,
  Bot,
  Clock3,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  Palette,
  Play,
  Plus,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { useCloudHealth } from '../hooks/useCloudHealth'
import { useI18n } from '../i18n'
import { isDesktopApp } from '../services/desktopBridge'
import type { TranslationKey } from '../i18n'

interface RecentProject {
  id: string
  name: string
  lastOpened: number
  fileCount: number
}

type WelcomeFeatureAction = 'ai' | 'run' | 'terminal' | 'git' | 'settings' | 'collab'

interface WelcomeScreenProps {
  recentProjects?: RecentProject[]
  onNewProject: () => void
  onOpenProject: () => void
  onOpenWorkspace: (id: string) => void
  onOpenSettings: () => void
  onOpenAIChat: () => void
  onOpenTerminal?: () => void
  onOpenGit?: () => void
  onOpenCollaboration?: () => void
  shortcuts?: { key: string; action: string }[]
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  recentProjects = [],
  onNewProject,
  onOpenProject,
  onOpenWorkspace,
  onOpenSettings,
  onOpenAIChat,
  onOpenTerminal,
  onOpenGit,
  onOpenCollaboration,
  shortcuts: shortcutsProp,
}) => {
  const { t, locale } = useI18n()
  const cloudHealth = useCloudHealth()
  const legalPrivacy = locale === 'en-US' ? '/legal/privacy-en.html' : '/legal/privacy.html'
  const legalTerms = locale === 'en-US' ? '/legal/terms-en.html' : '/legal/terms.html'

  const shortcuts = useMemo(() => {
    if (shortcutsProp) return shortcutsProp
    return [
      { key: 'Ctrl+N', action: t('welcome.shortcut.newFile') },
      { key: 'Ctrl+O', action: t('welcome.shortcut.openProject') },
      { key: 'Ctrl+S', action: t('welcome.shortcut.save') },
      { key: 'Ctrl+Enter', action: t('welcome.shortcut.run') },
      { key: 'Ctrl+Shift+P', action: t('welcome.shortcut.commandPalette') },
      { key: 'Ctrl+Shift+F', action: t('welcome.shortcut.search') },
    ]
  }, [shortcutsProp, t])

  const quickActions = useMemo(
    () =>
      [
        {
          title: t('welcome.quick.new.title'),
          description: t('welcome.quick.new.desc'),
          icon: Plus,
          accent: '#10b981',
          actionKey: 'new' as const,
          cta: t('welcome.cta.template'),
        },
        {
          title: t('welcome.quick.open.title'),
          description: t('welcome.quick.open.desc'),
          icon: FolderOpen,
          accent: '#3b82f6',
          actionKey: 'open' as const,
          cta: t('welcome.cta.manage'),
        },
        {
          title: t('welcome.quick.ai.title'),
          description: t('welcome.quick.ai.desc'),
          icon: Bot,
          accent: '#8b5cf6',
          actionKey: 'ai' as const,
          cta: t('welcome.cta.ai'),
        },
      ] as const,
    [t],
  )

  const featureCards = useMemo(
    () =>
      [
        {
          icon: Bot,
          titleKey: 'welcome.feature.ai.title' as TranslationKey,
          descKey: 'welcome.feature.ai.desc' as TranslationKey,
          color: '#8b5cf6',
          action: 'ai' as WelcomeFeatureAction,
        },
        {
          icon: Play,
          titleKey: 'welcome.feature.run.title' as TranslationKey,
          descKey: 'welcome.feature.run.desc' as TranslationKey,
          color: '#2563eb',
          action: 'run' as WelcomeFeatureAction,
        },
        {
          icon: Terminal,
          titleKey: 'welcome.feature.terminal.title' as TranslationKey,
          descKey: 'welcome.feature.terminal.desc' as TranslationKey,
          color: '#059669',
          action: 'terminal' as WelcomeFeatureAction,
        },
        {
          icon: GitBranch,
          titleKey: 'welcome.feature.git.title' as TranslationKey,
          descKey: 'welcome.feature.git.desc' as TranslationKey,
          color: '#ec4899',
          action: 'git' as WelcomeFeatureAction,
        },
        {
          icon: Palette,
          titleKey: 'welcome.feature.settings.title' as TranslationKey,
          descKey: 'welcome.feature.settings.desc' as TranslationKey,
          color: '#f59e0b',
          action: 'settings' as WelcomeFeatureAction,
        },
        {
          icon: Globe,
          titleKey: 'welcome.feature.collab.title' as TranslationKey,
          descKey: 'welcome.feature.collab.desc' as TranslationKey,
          color: '#06b6d4',
          action: 'collab' as WelcomeFeatureAction,
        },
      ] as const,
    [],
  )

  const handleFeatureAction = (action: WelcomeFeatureAction) => {
    switch (action) {
      case 'ai':
        onOpenAIChat()
        break
      case 'run':
        onOpenTerminal?.()
        break
      case 'terminal':
        onOpenTerminal?.()
        break
      case 'git':
        onOpenGit?.()
        break
      case 'settings':
        onOpenSettings()
        break
      case 'collab':
        onOpenCollaboration?.()
        break
    }
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-shell">
        <header className="welcome-header">
          <div className="welcome-hero">
            <div className="welcome-brand-row">
              <div className="welcome-logo">
                <img src="/logo-ai-ide.png" alt="" width={56} height={56} decoding="async" />
              </div>
              <div>
                <div className="welcome-badge-row">
                  <div className="welcome-badge">
                    <Sparkles size={14} />
                    {t('welcome.badge')}
                  </div>
                  {isDesktopApp() ? (
                    <span className="welcome-rc-badge">{t('welcome.desktopBadge')}</span>
                  ) : (
                    <span className="welcome-rc-badge">
                      {import.meta.env.VITE_GA_LIVE === 'true'
                        ? t('welcome.gaBadge')
                        : t('welcome.rcBadge')}
                    </span>
                  )}
                </div>
                <h1 className="welcome-title">{t('welcome.title')}</h1>
              </div>
            </div>
            <p className="welcome-lead">{t('welcome.lead')}</p>
          </div>

          <button type="button" className="welcome-settings-btn" onClick={onOpenSettings}>
            <Settings size={16} />
            {t('welcome.settings')}
          </button>
        </header>

        {cloudHealth.status !== 'loading' && (
          <p
            className={`welcome-cloud-banner ${
              cloudHealth.status === 'ok' ? 'welcome-cloud-banner--ok' : 'welcome-cloud-banner--warn'
            }`}
            role="status"
          >
            {cloudHealth.status === 'ok' ? t('welcome.cloudOk') : t('welcome.cloudDegraded')}
          </p>
        )}

        <main className="welcome-main">
          <section className="welcome-panel">
            <div className="welcome-section-label">
              <Play size={16} color="var(--accent-color)" />
              <span>{t('welcome.quickStart')}</span>
            </div>

            <div className="welcome-quick-list">
              {quickActions.map((item) => {
                const ActionIcon = item.icon
                const onClick =
                  item.actionKey === 'new' ? onNewProject : item.actionKey === 'open' ? onOpenProject : onOpenAIChat

                return (
                  <button
                    key={item.actionKey}
                    type="button"
                    className="welcome-quick-card"
                    style={{ '--quick-accent': item.accent } as CSSProperties}
                    onClick={onClick}
                  >
                    <div className="welcome-quick-icon">
                      <ActionIcon size={26} />
                    </div>
                    <div>
                      <div className="welcome-quick-title">{item.title}</div>
                      <div className="welcome-quick-desc">{item.description}</div>
                    </div>
                    <div className="welcome-quick-cta">
                      {item.cta}
                      <ArrowRight size={16} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="welcome-recent-block">
              <div className="welcome-section-label">
                <Folder size={16} />
                <span>{t('welcome.recent')}</span>
              </div>

              {recentProjects.length > 0 ? (
                recentProjects.slice(0, 4).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="welcome-recent-item"
                    onClick={() => onOpenWorkspace(project.id)}
                  >
                    <div className="welcome-recent-icon">
                      <FolderOpen size={18} color="var(--accent-color)" />
                    </div>
                    <div>
                      <div className="welcome-recent-name">{project.name}</div>
                      <div className="welcome-recent-meta">
                        {t('welcome.recentFiles', { count: project.fileCount })}
                      </div>
                    </div>
                    <div className="welcome-recent-date">
                      <Clock3 size={14} />
                      {new Date(project.lastOpened).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </button>
                ))
              ) : (
                <div className="welcome-empty-recent">{t('welcome.recentEmpty')}</div>
              )}
            </div>
          </section>

          <section className="welcome-side">
            <div className="welcome-panel welcome-panel--muted">
              <div className="welcome-section-label">
                <Sparkles size={16} color="var(--accent-color)" />
                <span>{t('welcome.features')}</span>
              </div>

              <div className="welcome-feature-grid">
                {featureCards.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <button
                      type="button"
                      key={feature.titleKey}
                      className="welcome-feature-card"
                      style={{ '--feature-color': feature.color } as CSSProperties}
                      onClick={() => handleFeatureAction(feature.action)}
                    >
                      <div className="welcome-feature-icon">
                        <Icon size={20} />
                      </div>
                      <div className="welcome-feature-title">{t(feature.titleKey)}</div>
                      <div className="welcome-feature-desc">{t(feature.descKey)}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="welcome-panel welcome-panel--muted">
              <div className="welcome-section-label">
                <Terminal size={16} color="var(--accent-color)" />
                <span>{t('welcome.shortcuts')}</span>
              </div>

              <div className="welcome-shortcut-list">
                {shortcuts.map((shortcut) => (
                  <div key={`${shortcut.key}-${shortcut.action}`} className="welcome-shortcut-row">
                    <span className="welcome-shortcut-action">{shortcut.action}</span>
                    <kbd className="welcome-kbd">{shortcut.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="welcome-footer">
          <a href={legalPrivacy} target="_blank" rel="noreferrer">
            {t('welcome.footer.privacy')}
          </a>
          <a href={legalTerms} target="_blank" rel="noreferrer">
            {t('welcome.footer.terms')}
          </a>
          <a href="/help/browser-limits.html" target="_blank" rel="noreferrer">
            {t('welcome.footer.browser')}
          </a>
          <span>{t('welcome.footer.aiNote')}</span>
        </footer>
      </div>
    </div>
  )
}

export default WelcomeScreen
