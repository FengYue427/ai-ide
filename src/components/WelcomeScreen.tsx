import React, { type CSSProperties } from 'react'
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

const defaultShortcuts = [
  { key: 'Ctrl+N', action: '新建文件' },
  { key: 'Ctrl+O', action: '打开项目' },
  { key: 'Ctrl+S', action: '立即保存' },
  { key: 'Ctrl+Enter', action: '运行代码' },
  { key: 'Ctrl+Shift+P', action: '打开命令面板' },
  { key: 'Ctrl+Shift+F', action: '全局搜索' },
]

const featureCards: Array<{
  icon: typeof Bot
  title: string
  desc: string
  color: string
  action: WelcomeFeatureAction
}> = [
  { icon: Bot, title: 'AI 结对编程', desc: '对话生成、重构和解释代码', color: '#8b5cf6', action: 'ai' },
  { icon: Play, title: '浏览器内运行', desc: '基于 WebContainer 的即时执行', color: '#2563eb', action: 'run' },
  { icon: Terminal, title: '集成终端', desc: '边写边跑，少切换上下文', color: '#059669', action: 'terminal' },
  { icon: GitBranch, title: 'Git 工作流', desc: '在 IDE 内追踪和提交变更', color: '#ec4899', action: 'git' },
  { icon: Palette, title: '主题与设置', desc: '快速切换工作习惯与界面风格', color: '#f59e0b', action: 'settings' },
  { icon: Globe, title: '协作扩展', desc: '实验性房间与在线用户', color: '#06b6d4', action: 'collab' },
]

const quickActions = [
  {
    title: '从模板新建项目',
    description: '选择 React、Node 等 starter 模板开始编码。',
    icon: Plus,
    accent: '#10b981',
    actionKey: 'new',
  },
  {
    title: '打开工作区管理',
    description: '加载云端/本地快照，或导入文件夹。',
    icon: FolderOpen,
    accent: '#3b82f6',
    actionKey: 'open',
  },
  {
    title: '先和 AI 讨论方案',
    description: '从需求、调试或重构建议开始。',
    icon: Bot,
    accent: '#8b5cf6',
    actionKey: 'ai',
  },
] as const

const actionMap = {
  new: '模板',
  open: '管理',
  ai: 'AI',
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
  shortcuts = defaultShortcuts,
}) => {
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
                <div className="welcome-badge">
                  <Sparkles size={14} />
                  AI 原生浏览器 IDE
                </div>
                <h1 className="welcome-title">更快进入思路，更少消耗在环境上</h1>
              </div>
            </div>
            <p className="welcome-lead">
              打开文件、与 AI 协作、运行代码、管理工作区，全部在一个轻量界面里完成。
              从下面的入口直接开始工作，不用先穿过一层说明页。
            </p>
          </div>

          <button type="button" className="welcome-settings-btn" onClick={onOpenSettings}>
            <Settings size={16} />
            设置中心
          </button>
        </header>

        <main className="welcome-main">
          <section className="welcome-panel">
            <div className="welcome-section-label">
              <Play size={16} color="var(--accent-color)" />
              <span>快速开始</span>
            </div>

            <div className="welcome-quick-list">
              {quickActions.map((item) => {
                const ActionIcon = item.icon
                const onClick =
                  item.actionKey === 'new' ? onNewProject : item.actionKey === 'open' ? onOpenProject : onOpenAIChat

                return (
                  <button
                    key={item.title}
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
                      {actionMap[item.actionKey]}
                      <ArrowRight size={16} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="welcome-recent-block">
              <div className="welcome-section-label">
                <Folder size={16} />
                <span>最近项目</span>
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
                      <div className="welcome-recent-meta">{project.fileCount} 个文件</div>
                    </div>
                    <div className="welcome-recent-date">
                      <Clock3 size={14} />
                      {new Date(project.lastOpened).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </button>
                ))
              ) : (
                <div className="welcome-empty-recent">
                  还没有最近项目。新建一个工作区后，这里会保留你的最近入口。
                </div>
              )}
            </div>
          </section>

          <section className="welcome-side">
            <div className="welcome-panel welcome-panel--muted">
              <div className="welcome-section-label">
                <Sparkles size={16} color="var(--accent-color)" />
                <span>核心能力</span>
              </div>

              <div className="welcome-feature-grid">
                {featureCards.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <button
                      type="button"
                      key={feature.title}
                      className="welcome-feature-card"
                      style={{ '--feature-color': feature.color } as CSSProperties}
                      onClick={() => handleFeatureAction(feature.action)}
                    >
                      <div className="welcome-feature-icon">
                        <Icon size={20} />
                      </div>
                      <div className="welcome-feature-title">{feature.title}</div>
                      <div className="welcome-feature-desc">{feature.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="welcome-panel welcome-panel--muted">
              <div className="welcome-section-label">
                <Terminal size={16} color="var(--accent-color)" />
                <span>常用快捷键</span>
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
          <a href="/legal/privacy.html" target="_blank" rel="noreferrer">
            隐私政策
          </a>
          <a href="/legal/terms.html" target="_blank" rel="noreferrer">
            服务条款
          </a>
          <span>AI 对话与 API Key 由您选择的模型服务商直接处理。</span>
        </footer>
      </div>
    </div>
  )
}

export default WelcomeScreen
