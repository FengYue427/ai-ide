import React, { useState, useEffect } from 'react'
import { FileText, Folder, Play, Bot, GitBranch, Settings, Sparkles, Clock, Plus, ArrowRight, Code2, Terminal, Palette, Zap, Globe, ChevronRight } from 'lucide-react'

interface RecentProject {
  id: string
  name: string
  lastOpened: number
  fileCount: number
}

interface WelcomeScreenProps {
  recentProjects?: RecentProject[]
  onNewProject: () => void
  onOpenProject: () => void
  onOpenWorkspace: (id: string) => void
  onOpenSettings: () => void
  onOpenAIChat: () => void
  shortcuts?: { key: string; action: string }[]
}

const defaultShortcuts = [
  { key: 'Ctrl+N', action: '新建文件' },
  { key: 'Ctrl+O', action: '打开文件' },
  { key: 'Ctrl+S', action: '保存' },
  { key: 'Ctrl+Enter', action: '运行代码' },
  { key: 'Ctrl+Shift+P', action: '命令面板' },
  { key: 'Ctrl+Shift+F', action: '全局搜索' },
]

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  recentProjects = [],
  onNewProject,
  onOpenProject,
  onOpenWorkspace,
  onOpenSettings,
  onOpenAIChat,
  shortcuts = defaultShortcuts
}) => {
  const [mounted, setMounted] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cardAnimations = [
    { delay: '0ms', icon: Plus, color: '#10b981', bg: 'linear-gradient(135deg, #10b98120 0%, #05966930 100%)', border: '#10b981' },
    { delay: '100ms', icon: Folder, color: '#3b82f6', bg: 'linear-gradient(135deg, #3b82f620 0%, #2563eb30 100%)', border: '#3b82f6' },
    { delay: '200ms', icon: Bot, color: '#a855f7', bg: 'linear-gradient(135deg, #a855f720 0%, #9333ea30 100%)', border: '#a855f7' },
  ]

  const features = [
    { icon: <Bot size={20} />, title: 'AI 驱动', desc: '智能代码补全与对话', color: '#a855f7' },
    { icon: <Play size={20} />, title: '即时运行', desc: '浏览器内执行 Node.js', color: '#3b82f6' },
    { icon: <Terminal size={20} />, title: '内置终端', desc: '完整的命令行体验', color: '#10b981' },
    { icon: <Palette size={20} />, title: '多主题', desc: '9种精美配色方案', color: '#f59e0b' },
    { icon: <GitBranch size={20} />, title: '版本控制', desc: 'Git 集成与协作', color: '#ec4899' },
    { icon: <Globe size={20} />, title: '实时协作', desc: '多人同时编辑', color: '#06b6d4' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%),
          linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)
        `,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 64px',
        overflow: 'auto',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          marginBottom: '48px',
          transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
          opacity: mounted ? 1 : 0,
          transition: 'all 0.6s ease-out 0.1s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
              }}
            />
            <Code2 size={32} style={{ color: '#fff', position: 'relative', zIndex: 1 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AI IDE
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
              AI 原生开源轻量级 IDE · v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', flex: 1, maxWidth: '1400px' }}>
        {/* Left Column */}
        <div style={{ transform: mounted ? 'translateX(0)' : 'translateX(-30px)', opacity: mounted ? 1 : 0, transition: 'all 0.6s ease-out 0.2s' }}>
          {/* Quick Start */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              快速开始
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { onClick: onNewProject, icon: Plus, title: '新建项目', desc: '从空白项目或模板开始', color: '#10b981', delay: '0.3s' },
                { onClick: onOpenProject, icon: Folder, title: '打开项目', desc: '从工作区或文件导入', color: '#3b82f6', delay: '0.4s' },
                { onClick: onOpenAIChat, icon: Bot, title: 'AI 助手', desc: '开始与 AI 对话编程', color: '#a855f7', delay: '0.5s' },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    padding: '22px 26px',
                    background: `linear-gradient(135deg, ${item.color}10 0%, ${item.color}05 100%)`,
                    border: `1.5px solid ${hoveredCard === index ? item.color : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredCard === index ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
                    boxShadow: hoveredCard === index ? `0 12px 40px ${item.color}25` : '0 4px 20px rgba(0,0,0,0.1)',
                    opacity: mounted ? 1 : 0,
                    animation: mounted ? `fadeInUp 0.5s ease-out ${item.delay} forwards` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${item.color}25 0%, ${item.color}15 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 15px ${item.color}20`,
                      transition: 'all 0.3s ease',
                      transform: hoveredCard === index ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <item.icon size={26} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                  <ChevronRight 
                    size={22} 
                    style={{ 
                      color: hoveredCard === index ? item.color : 'var(--text-secondary)', 
                      transition: 'all 0.3s ease',
                      transform: hoveredCard === index ? 'translateX(4px)' : 'translateX(0)'
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                最近打开
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentProjects.slice(0, 5).map((project, index) => (
                  <button
                    key={project.id}
                    onClick={() => onOpenWorkspace(project.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 18px',
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.25s ease',
                      opacity: mounted ? 1 : 0,
                      animation: mounted ? `fadeInUp 0.4s ease-out ${0.6 + index * 0.1}s forwards` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-color)'
                      e.currentTarget.style.background = 'var(--bg-tertiary)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{project.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {project.fileCount} 个文件 · {new Date(project.lastOpened).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ transform: mounted ? 'translateX(0)' : 'translateX(30px)', opacity: mounted ? 1 : 0, transition: 'all 0.6s ease-out 0.3s' }}>
          {/* Features */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              核心功能
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px',
                    background: `linear-gradient(135deg, ${feature.color}10 0%, transparent 100%)`,
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.color
                    e.currentTarget.style.background = `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}05 100%)`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.background = `linear-gradient(135deg, ${feature.color}10 0%, transparent 100%)`
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ 
                    color: feature.color, 
                    marginBottom: '10px',
                    filter: `drop-shadow(0 2px 8px ${feature.color}40)`
                  }}>{feature.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '5px' }}>{feature.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              常用快捷键
            </h2>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              border: '1.5px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              {shortcuts.map((shortcut, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: i < shortcuts.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{shortcut.action}</span>
                  <kbd
                    style={{
                      padding: '5px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Version */}
          <div style={{ marginTop: '36px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              AI IDE v1.0.0 · 开源项目
            </p>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--accent-color)', 
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              View on GitHub <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default WelcomeScreen
