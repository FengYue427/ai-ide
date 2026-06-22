import React, { useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  Bot,
  Clock3,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  GraduationCap,
  Palette,
  Play,
  Plus,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { isAiGatewayEnabled } from '../lib/aiPlatformMode'
import { CapstoneFunnelDashboard } from './CapstoneFunnelDashboard'
import { resetCapstoneFunnelMetrics } from '../lib/capstoneFunnelMetrics'
import { trackCapstoneFunnelStep } from '../lib/conversionTracking'
import { shouldShowNetworkTips, useCloudHealth } from '../hooks/useCloudHealth'
import { getPublicAppOrigin, isCustomAppOrigin, resolveAppLogo } from '../lib/appOrigin'
import {
  isIpDeployHost,
  isSelfHostedDeploy,
  resolveIcpBeian,
} from '../lib/deployContext'
import { resolveAppUrl } from '../lib/externalNavigation'
import { dismissWelcomeOnboarding, shouldShowWelcomeOnboarding } from '../lib/welcomeOnboarding'
import type { LearningPath } from '../lib/learningPaths'
import { useI18n } from '../i18n'
import { isDesktopApp } from '../services/desktopBridge'
import type { TranslationKey } from '../i18n'
import { InlineStatePanel } from './InlineStatePanel'
import { LearningPathsSection } from './LearningPathsSection'
import { WelcomePlanComparison } from './WelcomePlanComparison'
import { isPublicWelfareClient } from '../lib/publicWelfare'

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
  onRegister?: () => void
  onOpenSpecStudio?: (prefill?: { specName?: string; templateId?: string }) => void
  onStartIntentDemo?: () => void
  onStartLearningPath?: (path: LearningPath) => void
  shortcuts?: { key: string; action: string }[]
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

function getReleaseBadgeLabel(t: (key: TranslationKey) => string): string {
  if (import.meta.env.VITE_GA_LIVE === 'true') {
    return t('welcome.gaBadge')
  }
  const version = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim()
  if (version && /-rc/i.test(version)) {
    return `${version.replace(/-rc.*/i, '')} RC`
  }
  if (version && /^1\.\d+\.\d+(\.\d+)?$/i.test(version) && !/-rc/i.test(version)) {
    return interpolate(t('welcome.stableBadge'), { version })
  }
  return t('welcome.rcBadge')
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
  onRegister,
  onOpenSpecStudio,
  onStartIntentDemo,
  onStartLearningPath,
  shortcuts: shortcutsProp,
}) => {
  const { t, locale } = useI18n()
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowWelcomeOnboarding())
  const cloudHealth = useCloudHealth()
  const showNetworkTips = shouldShowNetworkTips(cloudHealth, isDesktopApp())
  const showCnBetaBanner = isIpDeployHost()
  const appOrigin = getPublicAppOrigin()
  const footerOriginLabel = useMemo(() => {
    if (!appOrigin) return null
    if (isIpDeployHost()) return t('welcome.appUrlIp', { url: appOrigin })
    if (isCustomAppOrigin(appOrigin)) return t('welcome.appUrlSelfHosted', { url: appOrigin })
    return t('welcome.appUrl', { url: appOrigin })
  }, [appOrigin, t])
  const networkTipsKey = isSelfHostedDeploy()
    ? ('welcome.networkTipsSelfHosted' as const)
    : ('welcome.networkTips' as const)
  const icpBeian = resolveIcpBeian()
  const legalPrivacy = resolveAppUrl(
    locale === 'en-US' ? '/legal/privacy-en.html' : '/legal/privacy.html',
  )
  const legalTerms = resolveAppUrl(locale === 'en-US' ? '/legal/terms-en.html' : '/legal/terms.html')
  const browserLimitsHelp = resolveAppUrl('/help/browser-limits.html')
  const signupPageUrl = resolveAppUrl('/signup')
  const logoUrl = resolveAppLogo()

  const shortcuts = useMemo(() => {
    if (shortcutsProp) return shortcutsProp
    return [
      { key: 'Ctrl+N', action: t('welcome.shortcut.newFile') },
      { key: 'Ctrl+O', action: t('welcome.shortcut.openProject') },
      { key: 'Ctrl+S', action: t('welcome.shortcut.save') },
      { key: 'Ctrl+Enter', action: t('welcome.shortcut.run') },
      { key: 'Ctrl+Shift+P', action: t('welcome.shortcut.commandPalette') },
      { key: 'Ctrl+Shift+F', action: t('welcome.shortcut.search') },
      { key: 'Ctrl+`', action: t('welcome.shortcut.terminal') },
      { key: 'Ctrl+Shift+G', action: t('welcome.shortcut.git') },
      { key: 'Ctrl+Alt+4', action: t('welcome.shortcut.debugPanel') },
      { key: 'F5', action: t('welcome.shortcut.debugContinue') },
      { key: 'Shift+F5', action: t('welcome.shortcut.debugStop') },
    ]
  }, [shortcutsProp, t])

  const quickActions = useMemo(
    () =>
      [
        {
          title: t('welcome.quick.new.title'),
          description: t('welcome.quick.new.desc'),
          icon: Plus,
          accent: 'var(--accent-quick-new)',
          actionKey: 'new' as const,
          cta: t('welcome.cta.template'),
        },
        {
          title: t('welcome.quick.open.title'),
          description: t('welcome.quick.open.desc'),
          icon: FolderOpen,
          accent: 'var(--accent-quick-open)',
          actionKey: 'open' as const,
          cta: t('welcome.cta.manage'),
        },
        {
          title: t('welcome.quick.ai.title'),
          description: t('welcome.quick.ai.desc'),
          icon: Bot,
          accent: 'var(--accent-quick-ai)',
          actionKey: 'ai' as const,
          cta: t('welcome.cta.ai'),
        },
        ...(onOpenSpecStudio
          ? [
              {
                title: t('welcome.quick.specStudio.title'),
                description: t('welcome.quick.specStudio.desc'),
                icon: Sparkles,
                accent: 'var(--accent-color)',
                actionKey: 'spec' as const,
                cta: t('welcome.cta.specStudio'),
              },
            ]
          : []),
      ] as const,
    [onOpenSpecStudio, t],
  )

  const featureCards = useMemo(
    () =>
      [
        {
          icon: Bot,
          titleKey: 'welcome.feature.ai.title' as TranslationKey,
          descKey: 'welcome.feature.ai.desc' as TranslationKey,
          color: 'var(--accent-feature-ai)',
          action: 'ai' as WelcomeFeatureAction,
        },
        {
          icon: Play,
          titleKey: 'welcome.feature.run.title' as TranslationKey,
          descKey: 'welcome.feature.run.desc' as TranslationKey,
          color: 'var(--accent-feature-run)',
          action: 'run' as WelcomeFeatureAction,
        },
        {
          icon: Terminal,
          titleKey: 'welcome.feature.terminal.title' as TranslationKey,
          descKey: 'welcome.feature.terminal.desc' as TranslationKey,
          color: 'var(--accent-feature-terminal)',
          action: 'terminal' as WelcomeFeatureAction,
        },
        {
          icon: GitBranch,
          titleKey: 'welcome.feature.git.title' as TranslationKey,
          descKey: 'welcome.feature.git.desc' as TranslationKey,
          color: 'var(--accent-feature-git)',
          action: 'git' as WelcomeFeatureAction,
        },
        {
          icon: Palette,
          titleKey: 'welcome.feature.settings.title' as TranslationKey,
          descKey: 'welcome.feature.settings.desc' as TranslationKey,
          color: 'var(--accent-feature-settings)',
          action: 'settings' as WelcomeFeatureAction,
        },
        {
          icon: Globe,
          titleKey: 'welcome.feature.collab.title' as TranslationKey,
          descKey: 'welcome.feature.collab.desc' as TranslationKey,
          color: 'var(--accent-feature-collab)',
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
                <img src={logoUrl} alt="" width={56} height={56} decoding="async" />
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
                    <span className="welcome-rc-badge">{getReleaseBadgeLabel(t)}</span>
                  )}
                </div>
                <h1 className="welcome-title">{t('welcome.title')}</h1>
              </div>
            </div>
            <p className="welcome-lead">{t('welcome.lead')}</p>
            {onStartIntentDemo ? (
              <button
                type="button"
                className="welcome-intent-hero-cta"
                data-testid="welcome-intent-demo-hero"
                onClick={onStartIntentDemo}
              >
                <Sparkles size={18} />
                {t('welcome.pathIntentHero')}
                <ArrowRight size={16} />
              </button>
            ) : null}
            <div className="welcome-dual-path" data-testid="welcome-dual-path">
              {onStartIntentDemo ? (
                <button
                  type="button"
                  className="welcome-dual-path__card welcome-dual-path__card--intent welcome-dual-path__card--primary"
                  data-testid="welcome-intent-demo"
                  onClick={onStartIntentDemo}
                >
                  <strong>{t('welcome.pathIntentTitle')}</strong>
                  <span>{t('welcome.pathIntentDesc')}</span>
                </button>
              ) : null}
              <button type="button" className="welcome-dual-path__card" onClick={onNewProject}>
                <strong>{t('welcome.pathLocalTitle')}</strong>
                <span>{t('welcome.pathLocalDesc')}</span>
              </button>
              {onRegister ? (
                <button
                  type="button"
                  className="welcome-dual-path__card welcome-dual-path__card--cloud"
                  onClick={onRegister}
                >
                  <strong>{t('welcome.pathCloudTitle')}</strong>
                  <span>{t('welcome.pathCloudDesc')}</span>
                </button>
              ) : null}
            </div>
            {onOpenSpecStudio ? (
              <button
                type="button"
                className="welcome-capstone-spotlight"
                data-testid="welcome-capstone-spotlight"
                onClick={() => {
                  resetCapstoneFunnelMetrics('capstone')
                  trackCapstoneFunnelStep('welcome_click', { specSlug: 'capstone' })
                  onOpenSpecStudio({ templateId: 'course-capstone', specName: 'capstone' })
                }}
              >
                <div className="welcome-capstone-spotlight__icon">
                  <GraduationCap size={22} />
                </div>
                <div className="welcome-capstone-spotlight__body">
                  <strong>{t('welcome.capstone.title')}</strong>
                  <span>{t('welcome.capstone.desc')}</span>
                </div>
                <ArrowRight size={18} className="welcome-capstone-spotlight__arrow" />
              </button>
            ) : null}
            {onOpenSpecStudio ? (
              <CapstoneFunnelDashboard
                onResume={() => onOpenSpecStudio({ templateId: 'course-capstone', specName: 'capstone' })}
              />
            ) : null}
            {isAiGatewayEnabled() && onRegister ? (
              <div className="welcome-platform-cta" data-testid="welcome-platform-cta">
                <p className="welcome-platform-cta-text">{t('welcome.platformCta')}</p>
                <p className="welcome-platform-quota-hint" data-testid="welcome-platform-quota-hint">
                  {t('welcome.platformQuotaHint')}
                </p>
                <button type="button" className="welcome-platform-cta-btn" onClick={onRegister}>
                  {t('welcome.platformCtaButton')}
                  <ArrowRight size={16} />
                </button>
                <a className="welcome-platform-cta-link" href={signupPageUrl}>
                  {t('welcome.platformCtaSignupPage')}
                </a>
              </div>
            ) : null}
          </div>

          <button type="button" className="welcome-settings-btn" onClick={onOpenSettings}>
            <Settings size={16} />
            {t('welcome.settings')}
          </button>
        </header>

        {showOnboarding && (
          <div className="welcome-onboarding-banner" role="note">
            <div>
              <strong>{t('welcome.onboarding.title')}</strong>
              <p>{t('welcome.onboarding.desc')}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                dismissWelcomeOnboarding()
                setShowOnboarding(false)
              }}
            >
              {t('welcome.onboarding.dismiss')}
            </button>
          </div>
        )}

        {cloudHealth.status !== 'loading' && (
          <p
            className={`welcome-cloud-banner ${
              cloudHealth.status === 'ok' ? 'welcome-cloud-banner--ok' : 'welcome-cloud-banner--warn'
            }`}
            role="status"
          >
            {cloudHealth.status === 'ok'
              ? t('welcome.cloudOk')
              : isAiGatewayEnabled()
                ? t('welcome.cloudDegradedPlatform')
                : t('welcome.cloudDegraded')}
          </p>
        )}

        {showCnBetaBanner ? (
          <p className="welcome-cloud-banner welcome-cloud-banner--info" role="note">
            {t('welcome.cnBetaBanner')}
          </p>
        ) : null}

        {showNetworkTips && (
          <p className="welcome-cloud-banner welcome-cloud-banner--info" role="status">
            {t(networkTipsKey)}
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
                  item.actionKey === 'new'
                    ? onNewProject
                    : item.actionKey === 'open'
                      ? onOpenProject
                      : item.actionKey === 'spec'
                        ? () => onOpenSpecStudio?.()
                        : onOpenAIChat

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
                <InlineStatePanel
                  compact
                  tone="empty"
                  icon={FolderOpen}
                  title={t('welcome.recentEmptyTitle')}
                  description={t('welcome.recentEmpty')}
                  primaryAction={{ label: t('welcome.cta.template'), onClick: onNewProject }}
                  secondaryAction={{
                    label: t('welcome.cta.manage'),
                    onClick: onOpenProject,
                    variant: 'secondary',
                  }}
                  className="welcome-recent-empty"
                />
              )}
            </div>

            {onStartLearningPath ? <LearningPathsSection onStartPath={onStartLearningPath} /> : null}

            {!isPublicWelfareClient() ? (
              <div className="welcome-panel welcome-panel--muted">
                <WelcomePlanComparison />
              </div>
            ) : null}
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
          {footerOriginLabel ? <span>{footerOriginLabel}</span> : null}
          {(() => {
            const version = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim()
            if (!version || !/^1\.\d+\.\d+(\.\d+)?$/i.test(version)) return null
            return (
              <a
                href={`https://github.com/FengYue427/ai-ide/releases/tag/v${version}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('welcome.footer.release')} (v{version})
              </a>
            )
          })()}
          <a href={legalPrivacy} target="_blank" rel="noreferrer">
            {t('welcome.footer.privacy')}
          </a>
          <a href={legalTerms} target="_blank" rel="noreferrer">
            {t('welcome.footer.terms')}
          </a>
          <a href={browserLimitsHelp} target="_blank" rel="noreferrer">
            {t('welcome.footer.browser')}
          </a>
          <span>{t('welcome.footer.aiNote')}</span>
          {icpBeian ? (
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
              {icpBeian}
            </a>
          ) : null}
        </footer>
      </div>
    </div>
  )
}

export default WelcomeScreen
