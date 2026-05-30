import React, { useEffect, useMemo, useState } from 'react'
import { projectIndexManager } from '../services/projectIndexManager'
import { collectPackageScriptSources, parsePackageScripts } from '../services/packageJsonService'
import { workspaceContextService } from '../services/workspaceContextService'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import { InlineStatePanel } from './InlineStatePanel'
import type { FileItem } from '../types/file'
import {
  AlignLeft,
  Activity,
  Bot,
  CheckSquare,
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
  onOpenScripts?: () => void
  onOpenTasks?: () => void
  onOpenPreview: () => void
  onOpenCodeReview: () => void
  onOpenPerformance: () => void
  onOpenPluginManager: () => void
  onExportZip: () => void
  onToggleTheme: () => void
  onToggleAutoSave: () => void
  onFormatDocument: () => void
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
  onOpenScripts,
  onOpenTasks,
  onOpenPreview,
  onOpenCodeReview,
  onOpenPerformance,
  onOpenPluginManager,
  onExportZip,
  onToggleTheme,
  onToggleAutoSave,
  onFormatDocument,
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
  const { t } = useI18n()
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

    const sources = collectPackageScriptSources(
      files.map((file) => ({ name: file.name, content: file.content })),
      workspaceContextService.getAllFiles(),
    )

    return parsePackageScripts(sources).map((script) => ({
      id: `npm-${script.name}`,
      title: `npm run ${script.name}`,
      subtitle: script.command,
      icon: <Terminal size={18} />,
      category: t('command.cat.npm'),
      action: () => {
        void onRunNpmScript(script.name)
        onClose()
      },
    }))
  }, [files, onClose, onRunNpmScript, t])

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
          : t('command.index.workspace'),
      icon: <Code2 size={18} />,
      category: t('command.cat.index'),
      action: () => revealPath(hit.path, hit.line ?? 1),
    }))
  }, [indexVersion, searchQuery, setActiveFile, setEditorTarget, onClose, t])

  const commands: Command[] = useMemo(
    () => [
      ...files.map((file, index) => ({
        id: `file-${index}`,
        title: file.name,
        subtitle: t('command.openFile'),
        icon: <FileText size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onSelectFile(index)
          onClose()
        },
      })),
      {
        id: 'new-file',
        title: t('command.newFile'),
        subtitle: t('command.newFile.sub'),
        icon: <FileText size={18} />,
        shortcut: 'Ctrl+N',
        category: t('command.cat.files'),
        action: () => {
          onNewFile()
          onClose()
        },
      },
      {
        id: 'new-from-template',
        title: t('command.newTemplate'),
        subtitle: t('command.newTemplate.sub'),
        icon: <FileText size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onOpenTemplate()
          onClose()
        },
      },
      {
        id: 'workspace-import',
        title: t('command.importFolder'),
        subtitle: t('command.importFolder.sub'),
        icon: <Folder size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onOpenWorkspaceImport()
          onClose()
        },
      },
      {
        id: 'export-file',
        title: t('command.exportFile'),
        icon: <Download size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onExportFile()
          onClose()
        },
      },
      {
        id: 'export-zip',
        title: t('command.exportZip'),
        icon: <Package size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onExportZip()
          onClose()
        },
      },
      {
        id: 'import-files',
        title: t('command.import'),
        icon: <Folder size={18} />,
        category: t('command.cat.files'),
        action: () => {
          onOpenImport()
          onClose()
        },
      },
      {
        id: 'format-document',
        title: t('command.formatDocument'),
        subtitle: t('command.formatDocument.sub'),
        icon: <AlignLeft size={18} />,
        shortcut: 'Ctrl+Shift+I',
        category: t('command.cat.editor'),
        action: () => {
          onFormatDocument()
          onClose()
        },
      },
      {
        id: 'run-code',
        title: t('command.run'),
        subtitle: t('command.run.sub'),
        icon: <Play size={18} />,
        shortcut: 'Ctrl+Enter',
        category: t('command.cat.run'),
        action: () => {
          onRunCode()
          onClose()
        },
      },
      {
        id: 'toggle-terminal',
        title: t('command.terminal'),
        icon: <Terminal size={18} />,
        category: t('command.cat.run'),
        action: () => {
          onOpenTerminal()
          onClose()
        },
      },
      ...(onOpenScripts
        ? [
            {
              id: 'open-scripts-panel',
              title: t('command.scriptsPanel'),
              icon: <Package size={18} />,
              category: t('command.cat.npm'),
              action: () => {
                onOpenScripts()
                onClose()
              },
            } satisfies Command,
          ]
        : []),
      ...(onOpenTasks
        ? [
            {
              id: 'open-tasks-panel',
              title: t('command.tasksPanel'),
              icon: <CheckSquare size={18} />,
              category: t('command.cat.tasks'),
              action: () => {
                onOpenTasks()
                onClose()
              },
            } satisfies Command,
          ]
        : []),
      {
        id: 'performance',
        title: t('command.performance'),
        subtitle: t('command.performance.sub'),
        icon: <Activity size={18} />,
        category: t('command.cat.run'),
        action: () => {
          onOpenPerformance()
          onClose()
        },
      },
      {
        id: 'ai-chat',
        title: t('command.ai'),
        subtitle: t('command.ai.sub'),
        icon: <Bot size={18} />,
        category: t('command.cat.ai'),
        action: () => {
          onOpenAIChat()
          onClose()
        },
      },
      {
        id: 'code-review',
        title: t('command.review'),
        subtitle: t('command.review.sub'),
        icon: <Shield size={18} />,
        category: t('command.cat.ai'),
        action: () => {
          onOpenCodeReview()
          onClose()
        },
      },
      {
        id: 'snippets',
        title: t('command.snippets'),
        subtitle: t('command.snippets.sub'),
        icon: <Code2 size={18} />,
        category: t('command.cat.ai'),
        action: () => {
          onOpenSnippetLibrary()
          onClose()
        },
      },
      {
        id: 'git',
        title: t('command.git'),
        subtitle: t('command.git.sub'),
        icon: <GitBranch size={18} />,
        category: t('command.cat.collab'),
        action: () => {
          onOpenGit()
          onClose()
        },
      },
      {
        id: 'share',
        title: t('command.share'),
        subtitle: t('command.share.sub'),
        icon: <Share2 size={18} />,
        category: t('command.cat.collab'),
        action: () => {
          onOpenShare()
          onClose()
        },
      },
      {
        id: 'collaboration',
        title: t('command.collab'),
        subtitle: t('command.collab.sub'),
        icon: <Users size={18} />,
        category: t('command.cat.collab'),
        action: () => {
          onOpenCollaboration()
          onClose()
        },
      },
      {
        id: 'preview',
        title: t('command.preview'),
        subtitle: t('command.preview.sub'),
        icon: <Eye size={18} />,
        category: t('command.cat.view'),
        action: () => {
          onOpenPreview()
          onClose()
        },
      },
      {
        id: 'search',
        title: t('command.search'),
        subtitle: t('command.search.sub'),
        icon: <Search size={18} />,
        category: t('command.cat.view'),
        action: () => {
          onOpenSearch()
          onClose()
        },
      },
      {
        id: 'plugins',
        title: t('command.plugins'),
        subtitle: t('command.plugins.sub'),
        icon: <Puzzle size={18} />,
        category: t('command.cat.view'),
        action: () => {
          onOpenPluginManager()
          onClose()
        },
      },
      {
        id: 'welcome-home',
        title: t('command.welcome'),
        subtitle: t('command.welcome.sub'),
        icon: <Home size={18} />,
        category: t('command.cat.view'),
        action: () => {
          onOpenWelcome()
          onClose()
        },
      },
      {
        id: 'settings',
        title: t('command.settings'),
        subtitle: t('command.settings.sub'),
        icon: <Settings size={18} />,
        shortcut: 'Ctrl+,',
        category: t('command.cat.settings'),
        action: () => {
          onOpenSettings()
          onClose()
        },
      },
      {
        id: 'theme-selector',
        title: t('command.themePicker'),
        subtitle: t('command.themePicker.sub'),
        icon: <Palette size={18} />,
        category: t('command.cat.settings'),
        action: () => {
          onOpenThemeSelector()
          onClose()
        },
      },
      {
        id: 'toggle-theme',
        title: theme === 'vs-dark' ? t('command.themeToLight') : t('command.themeToDark'),
        icon: theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />,
        category: t('command.cat.settings'),
        action: () => {
          onToggleTheme()
          onClose()
        },
      },
      {
        id: 'toggle-autosave',
        title: autoSaveEnabled ? t('command.autosaveOff') : t('command.autosaveOn'),
        icon: <Save size={18} />,
        category: t('command.cat.settings'),
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
      onOpenScripts,
      onOpenTasks,
      onOpenTerminal,
      onFormatDocument,
      onRunCode,
      onSelectFile,
      onToggleAutoSave,
      onToggleTheme,
      onOpenTemplate,
      onOpenWorkspaceImport,
      onOpenThemeSelector,
      onOpenWelcome,
      t,
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
            placeholder={t('command.placeholder')}
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
            <InlineStatePanel
              compact
              tone="hint"
              icon={Search}
              title={t('command.empty.title')}
              description={t('command.empty.desc')}
            />
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
          <span>{t('command.footer.enter')}</span>
          <span>{t('command.footer.navigate')}</span>
          <span>{t('command.footer.close')}</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
