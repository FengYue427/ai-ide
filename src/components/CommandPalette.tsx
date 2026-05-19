import React, { useEffect, useMemo, useState } from 'react'
import { projectIndexManager } from '../services/projectIndexManager'
import { parsePackageScripts } from '../services/packageJsonService'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'
import {
  Activity,
  Bot,
  Code2,
  Download,
  Eye,
  FileText,
  Folder,
  GitBranch,
  Home,
  Moon,
  Package,
  Palette,
  Play,
  Puzzle,
  Save,
  Search,
  Settings,
  Share2,
  Shield,
  Sun,
  Terminal,
  Users,
} from 'lucide-react'

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
  files: FileItem[]
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
  onOpenTemplate: () => void
  onOpenWorkspaceImport: () => void
  onOpenThemeSelector: () => void
  onOpenWelcome: () => void
  onRunNpmScript?: (scriptName: string) => void | Promise<void>
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  zIndex: 3000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '12vh',
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
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
  onOpenTemplate,
  onOpenWorkspaceImport,
  onOpenThemeSelector,
  onOpenWelcome,
  onRunNpmScript,
  theme,
  autoSaveEnabled,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [indexVersion, setIndexVersion] = useState(() => projectIndexManager.getVersion())
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)

  useEffect(() => projectIndexManager.subscribe(() => setIndexVersion(projectIndexManager.getVersion())), [])

  const revealPath = (path: string, line = 1) => {
    const normalized = path.replace(/^\.\//, '')
    const index = files.findIndex(
      (file) => file.name === normalized || file.name.endsWith(`/${normalized}`) || file.name.endsWith(normalized),
    )
    if (index >= 0) {
      setActiveFile(index)
      setEditorTarget({ line, column: 1, nonce: Date.now() })
    }
    onClose()
  }

  const npmScriptCommands: Command[] = useMemo(() => {
    if (!onRunNpmScript) return []

    const sources = [
      ...files.map((file) => ({ name: file.name, content: file.content })),
      ...workspaceContextService.getAllFiles().map((file) => ({
        name: file.path,
        content: file.content,
      })),
    ]

    return parsePackageScripts(sources).map((script) => ({
      id: `npm-${script.name}`,
      title: `npm run ${script.name}`,
      subtitle: script.command,
      icon: <Terminal size={18} />,
      category: 'npm scripts',
      action: () => {
        void onRunNpmScript(script.name)
        onClose()
      },
    }))
  }, [files, onClose, onRunNpmScript])

  const indexCommands: Command[] = useMemo(() => {
    const raw = searchQuery.trim()
    if (!raw.startsWith('@')) return []

    const query = raw.slice(1).trim()
    if (!query) return []

    return projectIndexManager.search(query).map((hit) => ({
      id: `index-${hit.type}-${hit.path}-${hit.name}-${hit.line ?? 0}`,
      title: hit.type === 'symbol' ? hit.name : hit.path,
      subtitle:
        hit.type === 'symbol'
          ? `${hit.kind ?? 'symbol'} · ${hit.path}:${hit.line}`
          : '工作区 / 编辑器文件',
      icon: <Code2 size={18} />,
      category: '索引 (@)',
      action: () => revealPath(hit.path, hit.line ?? 1),
    }))
  }, [indexVersion, searchQuery, setActiveFile, setEditorTarget, onClose])

  const commands: Command[] = useMemo(
    () => [
      ...files.map((file, index) => ({
        id: `file-${index}`,
        title: file.name,
        subtitle: '打开文件',
        icon: <FileText size={18} />,
        category: '文件',
        action: () => {
          onSelectFile(index)
          onClose()
        },
      })),
      {
        id: 'new-file',
        title: '新建文件',
        subtitle: '创建一个空白文件',
        icon: <FileText size={18} />,
        shortcut: 'Ctrl+N',
        category: '文件',
        action: () => {
          onNewFile()
          onClose()
        },
      },
      {
        id: 'new-from-template',
        title: '从模板新建项目',
        subtitle: 'React、Node 等 starter',
        icon: <FileText size={18} />,
        category: '文件',
        action: () => {
          onOpenTemplate()
          onClose()
        },
      },
      {
        id: 'workspace-import',
        title: '导入文件夹到工作区',
        subtitle: '打开导入面板',
        icon: <Folder size={18} />,
        category: '文件',
        action: () => {
          onOpenWorkspaceImport()
          onClose()
        },
      },
      {
        id: 'export-file',
        title: '导出当前文件',
        icon: <Download size={18} />,
        category: '文件',
        action: () => {
          onExportFile()
          onClose()
        },
      },
      {
        id: 'export-zip',
        title: '导出项目 ZIP',
        icon: <Package size={18} />,
        category: '文件',
        action: () => {
          onExportZip()
          onClose()
        },
      },
      {
        id: 'import-files',
        title: '导入文件或项目',
        icon: <Folder size={18} />,
        category: '文件',
        action: () => {
          onOpenImport()
          onClose()
        },
      },
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
        },
      },
      {
        id: 'toggle-terminal',
        title: '显示或隐藏终端',
        icon: <Terminal size={18} />,
        category: '运行',
        action: () => {
          onOpenTerminal()
          onClose()
        },
      },
      {
        id: 'performance',
        title: '性能分析',
        subtitle: '查看代码执行表现',
        icon: <Activity size={18} />,
        category: '运行',
        action: () => {
          onOpenPerformance()
          onClose()
        },
      },
      {
        id: 'ai-chat',
        title: 'AI 助手',
        subtitle: '打开对话面板',
        icon: <Bot size={18} />,
        category: 'AI',
        action: () => {
          onOpenAIChat()
          onClose()
        },
      },
      {
        id: 'code-review',
        title: '代码审查',
        subtitle: '检查代码质量与风险',
        icon: <Shield size={18} />,
        category: 'AI',
        action: () => {
          onOpenCodeReview()
          onClose()
        },
      },
      {
        id: 'snippets',
        title: '代码片段库',
        subtitle: '插入常用片段',
        icon: <Code2 size={18} />,
        category: 'AI',
        action: () => {
          onOpenSnippetLibrary()
          onClose()
        },
      },
      {
        id: 'git',
        title: 'Git 面板',
        subtitle: '查看改动与历史',
        icon: <GitBranch size={18} />,
        category: '协作',
        action: () => {
          onOpenGit()
          onClose()
        },
      },
      {
        id: 'share',
        title: '分享项目',
        subtitle: '生成快照或导入分享',
        icon: <Share2 size={18} />,
        category: '协作',
        action: () => {
          onOpenShare()
          onClose()
        },
      },
      {
        id: 'collaboration',
        title: '实时协作',
        subtitle: '加入共享房间',
        icon: <Users size={18} />,
        category: '协作',
        action: () => {
          onOpenCollaboration()
          onClose()
        },
      },
      {
        id: 'preview',
        title: '预览面板',
        subtitle: '查看 HTML 或文本输出',
        icon: <Eye size={18} />,
        category: '视图',
        action: () => {
          onOpenPreview()
          onClose()
        },
      },
      {
        id: 'search',
        title: '全局搜索',
        subtitle: '在文件中查找内容',
        icon: <Search size={18} />,
        category: '视图',
        action: () => {
          onOpenSearch()
          onClose()
        },
      },
      {
        id: 'plugins',
        title: '插件管理',
        subtitle: '启用或加载扩展',
        icon: <Puzzle size={18} />,
        category: '视图',
        action: () => {
          onOpenPluginManager()
          onClose()
        },
      },
      {
        id: 'welcome-home',
        title: '返回欢迎页',
        subtitle: '快速开始、模板与最近项目',
        icon: <Home size={18} />,
        category: '视图',
        action: () => {
          onOpenWelcome()
          onClose()
        },
      },
      {
        id: 'settings',
        title: '设置中心',
        subtitle: '调整编辑器与 AI 配置',
        icon: <Settings size={18} />,
        shortcut: 'Ctrl+,',
        category: '设置',
        action: () => {
          onOpenSettings()
          onClose()
        },
      },
      {
        id: 'theme-selector',
        title: '主题选择器',
        subtitle: '浏览全部编辑器主题',
        icon: <Palette size={18} />,
        category: '设置',
        action: () => {
          onOpenThemeSelector()
          onClose()
        },
      },
      {
        id: 'toggle-theme',
        title: `切换到${theme === 'vs-dark' ? '亮色' : '暗色'}主题`,
        icon: theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />,
        category: '设置',
        action: () => {
          onToggleTheme()
          onClose()
        },
      },
      {
        id: 'toggle-autosave',
        title: `${autoSaveEnabled ? '关闭' : '开启'}自动保存`,
        icon: <Save size={18} />,
        category: '设置',
        action: () => {
          onToggleAutoSave()
          onClose()
        },
      },
    ],
    [
      autoSaveEnabled,
      files,
      onClose,
      onExportFile,
      onExportZip,
      onNewFile,
      onOpenAIChat,
      onOpenCodeReview,
      onOpenCollaboration,
      onOpenGit,
      onOpenImport,
      onOpenPerformance,
      onOpenPluginManager,
      onOpenPreview,
      onOpenSearch,
      onOpenSettings,
      onOpenShare,
      onOpenSnippetLibrary,
      onOpenTerminal,
      onRunCode,
      onSelectFile,
      onToggleAutoSave,
      onToggleTheme,
      theme,
    ],
  )

  const filteredCommands = useMemo(() => {
    if (searchQuery.trim().startsWith('@')) return indexCommands

    const merged = [...npmScriptCommands, ...commands]
    const query = searchQuery.trim().toLowerCase()
    if (!query) return merged
    return merged.filter(
      (command) =>
        command.title.toLowerCase().includes(query) ||
        command.subtitle?.toLowerCase().includes(query) ||
        command.category.toLowerCase().includes(query),
    )
  }, [commands, indexCommands, npmScriptCommands, searchQuery])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) groups[command.category] = []
      groups[command.category].push(command)
    })
    return groups
  }, [filteredCommands])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          event.preventDefault()
          filteredCommands[selectedIndex]?.action()
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, isOpen, onClose, selectedIndex])

  if (!isOpen) return null

  let commandIndex = 0

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          background: 'color-mix(in srgb, var(--bg-primary) 96%, transparent)',
          boxShadow: '0 28px 60px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="命令 / 文件名，或 @ 搜索符号与文件"
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <kbd className="status-pill">ESC</kbd>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Search size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>没有找到匹配命令</div>
              <div style={{ fontSize: '13px' }}>试试输入文件名、功能名，或用 @ 搜索符号（如 @login）。</div>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category}>
                <div
                  style={{
                    padding: '10px 20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  {category}
                </div>
                {categoryCommands.map((command) => {
                  const currentIndex = commandIndex
                  const isSelected = currentIndex === selectedIndex
                  commandIndex += 1
                  return (
                    <button
                      key={command.id}
                      onClick={command.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isSelected ? 'color-mix(in srgb, var(--accent-color) 18%, transparent)' : 'transparent',
                        color: 'var(--text-primary)',
                        border: 'none',
                        borderBottom: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ opacity: isSelected ? 1 : 0.75 }}>{command.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{command.title}</div>
                        {command.subtitle && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{command.subtitle}</div>
                        )}
                      </div>
                      {command.shortcut && <kbd className="status-pill">{command.shortcut}</kbd>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            color: 'var(--text-secondary)',
            fontSize: '12px',
          }}
        >
          <span>Enter 执行</span>
          <span>↑↓ 选择</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
