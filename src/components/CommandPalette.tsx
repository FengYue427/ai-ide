import React, { useState, useEffect, useMemo } from 'react'
import { Search, FileText, Folder, Play, Settings, GitBranch, Share2, Bot, Code2, Terminal, Eye, Shield, Activity, Puzzle, Download, Moon, Sun, Users, Package, Save, Globe } from 'lucide-react'

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  shortcut?: string
  category: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  files: { name: string }[]
  activeFile: number
  onSelectFile: (index: number) => void
  onNewFile: () => void
  onRunCode: () => void
  onOpenSettings: () => void
  onOpenGit: () => void
  onOpenShare: () => void
  onOpenAIChat: () => void
  onOpenSnippetLibrary: () => void
  onOpenTerminal: () => void
  onOpenPreview: () => void
  onOpenCodeReview: () => void
  onOpenPerformance: () => void
  onOpenPluginManager: () => void
  onExportZip: () => void
  onToggleTheme: () => void
  onToggleAutoSave: () => void
  onOpenCollaboration: () => void
  onExportFile: () => void
  onOpenImport: () => void
  onOpenSearch: () => void
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  activeFile,
  onSelectFile,
  onNewFile,
  onRunCode,
  onOpenSettings,
  onOpenGit,
  onOpenShare,
  onOpenAIChat,
  onOpenSnippetLibrary,
  onOpenTerminal,
  onOpenPreview,
  onOpenCodeReview,
  onOpenPerformance,
  onOpenPluginManager,
  onExportZip,
  onToggleTheme,
  onToggleAutoSave,
  onOpenCollaboration,
  onExportFile,
  onOpenImport,
  onOpenSearch,
  theme,
  autoSaveEnabled
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = useMemo(() => [
    // 文件操作
    ...files.map((file, index) => ({
      id: `file-${index}`,
      title: file.name,
      subtitle: '打开文件',
      icon: <FileText size={18} />,
      category: '文件',
      action: () => {
        onSelectFile(index)
        onClose()
      }
    })),
    {
      id: 'new-file',
      title: '新建文件',
      subtitle: 'Ctrl+Shift+N',
      icon: <FileText size={18} />,
      shortcut: 'Ctrl+Shift+N',
      category: '文件',
      action: () => {
        onNewFile()
        onClose()
      }
    },
    {
      id: 'export-file',
      title: '导出当前文件',
      icon: <Download size={18} />,
      category: '文件',
      action: () => {
        onExportFile()
        onClose()
      }
    },
    {
      id: 'export-zip',
      title: '导出项目为 ZIP',
      icon: <Package size={18} />,
      category: '文件',
      action: () => {
        onExportZip()
        onClose()
      }
    },
    {
      id: 'import-files',
      title: '导入文件',
      icon: <Folder size={18} />,
      category: '文件',
      action: () => {
        onOpenImport()
        onClose()
      }
    },

    // 运行和调试
    {
      id: 'run-code',
      title: '运行代码',
      subtitle: '执行当前文件',
      icon: <Play size={18} />,
      shortcut: 'Ctrl+Enter',
      category: '运行',
      action: () => {
        onRunCode()
        onClose()
      }
    },
    {
      id: 'toggle-terminal',
      title: '显示/隐藏终端',
      icon: <Terminal size={18} />,
      category: '运行',
      action: () => {
        onOpenTerminal()
        onClose()
      }
    },
    {
      id: 'performance',
      title: '性能分析',
      subtitle: '查看代码执行性能',
      icon: <Activity size={18} />,
      category: '运行',
      action: () => {
        onOpenPerformance()
        onClose()
      }
    },

    // AI 功能
    {
      id: 'ai-chat',
      title: 'AI 助手',
      subtitle: '与 AI 对话',
      icon: <Bot size={18} />,
      category: 'AI',
      action: () => {
        onOpenAIChat()
        onClose()
      }
    },
    {
      id: 'code-review',
      title: '代码审查',
      subtitle: 'AI 分析代码质量',
      icon: <Shield size={18} />,
      category: 'AI',
      action: () => {
        onOpenCodeReview()
        onClose()
      }
    },
    {
      id: 'snippets',
      title: '代码片段库',
      subtitle: '插入常用代码',
      icon: <Code2 size={18} />,
      category: 'AI',
      action: () => {
        onOpenSnippetLibrary()
        onClose()
      }
    },

    // 协作
    {
      id: 'git',
      title: 'Git 面板',
      subtitle: '版本控制',
      icon: <GitBranch size={18} />,
      category: '协作',
      action: () => {
        onOpenGit()
        onClose()
      }
    },
    {
      id: 'share',
      title: '分享项目',
      subtitle: '生成分享链接',
      icon: <Share2 size={18} />,
      category: '协作',
      action: () => {
        onOpenShare()
        onClose()
      }
    },
    {
      id: 'collaboration',
      title: '实时协作',
      subtitle: '多人同时编辑',
      icon: <Users size={18} />,
      category: '协作',
      action: () => {
        onOpenCollaboration()
        onClose()
      }
    },

    // 视图
    {
      id: 'preview',
      title: '预览面板',
      subtitle: '预览 HTML 输出',
      icon: <Eye size={18} />,
      category: '视图',
      action: () => {
        onOpenPreview()
        onClose()
      }
    },
    {
      id: 'search',
      title: '全局搜索',
      subtitle: '搜索文件内容',
      icon: <Search size={18} />,
      category: '视图',
      action: () => {
        onOpenSearch()
        onClose()
      }
    },
    {
      id: 'plugins',
      title: '插件管理',
      icon: <Puzzle size={18} />,
      category: '视图',
      action: () => {
        onOpenPluginManager()
        onClose()
      }
    },

    // 设置
    {
      id: 'settings',
      title: '设置中心',
      subtitle: '配置 IDE',
      icon: <Settings size={18} />,
      shortcut: 'Ctrl+,',
      category: '设置',
      action: () => {
        onOpenSettings()
        onClose()
      }
    },
    {
      id: 'toggle-theme',
      title: `切换到${theme === 'vs-dark' ? '亮色' : '暗色'}主题`,
      icon: theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />,
      category: '设置',
      action: () => {
        onToggleTheme()
        onClose()
      }
    },
    {
      id: 'toggle-autosave',
      title: `${autoSaveEnabled ? '禁用' : '启用'}自动保存`,
      icon: <Save size={18} />,
      category: '设置',
      action: () => {
        onToggleAutoSave()
        onClose()
      }
    }
  ], [files, theme, autoSaveEnabled])

  const filteredCommands = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(query) ||
      cmd.subtitle?.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    )
  }, [commands, searchQuery])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          filteredCommands[selectedIndex]?.action()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  let commandIndex = 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入命令或搜索文件..."
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <kbd
            style={{
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <Search size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>未找到匹配的命令</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div
                  style={{
                    padding: '8px 20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.5px',
                    background: 'var(--bg-secondary)'
                  }}
                >
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const isSelected = commandIndex === selectedIndex
                  const currentIndex = commandIndex++
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isSelected ? 'var(--accent-color)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-primary)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>{cmd.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{cmd.title}</div>
                        {cmd.subtitle && (
                          <div
                            style={{
                              fontSize: '12px',
                              opacity: 0.7,
                              marginTop: '2px'
                            }}
                          >
                            {cmd.subtitle}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd
                          style={{
                            padding: '4px 8px',
                            background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <span>↑↓ 导航</span>
          <span>↵ 选择</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
