import React, { useEffect, useMemo, useState } from 'react'
import { projectIndexManager } from '../services/projectIndexManager'
import { collectPackageScriptSources, parsePackageScripts } from '../services/packageJsonService'
import { workspaceContextService } from '../services/workspaceContextService'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import type { RunNpmScriptHandler } from '../lib/npmScriptRun'
import { isSessionResumeStale, loadSessionResume } from '../lib/sessionResume'
import { getSessionResumeMaxAgeMs } from '../lib/clientPlanEntitlements'
import { canUseEntitlement } from '../lib/planFeatureGate'
import { WORKSPACE_MODES, type WorkspaceMode } from '../lib/workspaceMode'
import { InlineStatePanel } from './InlineStatePanel'
import type { FileItem } from '../types/file'
import {
  ArrowDownToLine,
  ArrowRightToLine,
  ArrowUpFromLine,
  AlignLeft,
  Activity,
  Bot,
  Bug,
  CheckSquare,
  Code2,
  Download,
  Eye,
  FileText,
  Folder,
  GitBranch,
  Home,
  Link2,
  BarChart3,
  History,
  LayoutGrid,
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
  Sparkles,
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
  onStageAll?: () => void
  gitStageAllDisabled?: boolean
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
  onGoToDefinition: () => void
  onGoToReferences: () => void
  onOpenCollaboration: () => void
  onExportFile: () => void
  onOpenImport: () => void
  onOpenSearch: () => void
  onOpenTemplate: () => void
  onOpenSpecStudio?: () => void
  onRunFirstRunnableSpecTask?: () => void
  onOpenWorkspaceImport: () => void
  onOpenThemeSelector: () => void
  onOpenWelcome: () => void
  onApplyWorkspaceMode?: (mode: WorkspaceMode) => void
  onSessionResume?: () => void
  onOpenWeeklyRecap?: () => void
  onOpenShareProgress?: () => void
  onRunAutopilotNext?: () => void
  onRunNpmScript?: RunNpmScriptHandler
  onOpenDebug?: () => void
  onStartDebug?: () => void
  onStopDebug?: () => void
  onDebugContinue?: () => void
  onDebugStepOver?: () => void
  onDebugStepInto?: () => void
  onDebugStepOut?: () => void
  theme: 'vs-dark' | 'light'
  autoSaveEnabled: boolean
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
  onStageAll,
  gitStageAllDisabled = false,
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
  onGoToDefinition,
  onGoToReferences,
  onOpenCollaboration,
  onExportFile,
  onOpenImport,
  onOpenSearch,
  onOpenTemplate,
  onOpenSpecStudio,
  onRunFirstRunnableSpecTask,
  onOpenWorkspaceImport,
  onOpenThemeSelector,
  onOpenWelcome,
  onApplyWorkspaceMode,
  onSessionResume,
  onOpenWeeklyRecap,
  onOpenShareProgress,
  onRunAutopilotNext,
  onRunNpmScript,
  onOpenDebug,
  onStartDebug,
  onStopDebug,
  onDebugContinue,
  onDebugStepOver,
  onDebugStepInto,
  onDebugStepOut,
  theme,
  autoSaveEnabled,
}) => {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [indexVersion, setIndexVersion] = useState(() => projectIndexManager.getVersion())
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const fullLinkageCommands = canUseEntitlement('fullLinkageCommands')
  const sessionResumeSnapshot = useMemo(() => loadSessionResume(), [])
  const canSessionResume =
    !!onSessionResume &&
    !!sessionResumeSnapshot &&
    !isSessionResumeStale(sessionResumeSnapshot, getSessionResumeMaxAgeMs(currentPlan ?? 'free'))

  const workspaceModeCommands: Command[] = useMemo(() => {
    if (!onApplyWorkspaceMode) return []
    const labelKeys = {
      code: 'workspaceMode.code',
      plan: 'workspaceMode.plan',
      execute: 'workspaceMode.execute',
      review: 'workspaceMode.review',
    } as const
    return WORKSPACE_MODES.map((mode) => ({
      id: `workspace-mode-${mode}`,
      title: t(labelKeys[mode]),
      subtitle: t('command.workspaceMode.sub'),
      icon: <LayoutGrid size={18} />,
      category: t('command.workspaceMode'),
      action: () => {
        onApplyWorkspaceMode(mode)
        onClose()
      },
    }))
  }, [onApplyWorkspaceMode, onClose, t])

  const experienceCommands: Command[] = useMemo(() => {
    const items: Command[] = []
    const linkageCategory = t('command.cat.linkage')
    if (canSessionResume) {
      items.push({
        id: 'session-resume',
        title: t('command.sessionResume'),
        subtitle: t('command.sessionResume.sub'),
        icon: <History size={18} />,
        category: linkageCategory,
        action: () => {
          onSessionResume?.()
          onClose()
        },
      })
    }
    if (onRunAutopilotNext && fullLinkageCommands) {
      items.push({
        id: 'linkage-autopilot',
        title: t('command.linkage.autopilot'),
        subtitle: t('command.linkage.autopilot.sub'),
        icon: <Sparkles size={18} />,
        category: linkageCategory,
        action: () => {
          onRunAutopilotNext()
          onClose()
        },
      })
    }
    if (onOpenShareProgress && fullLinkageCommands) {
      items.push({
        id: 'linkage-share-progress',
        title: t('command.linkage.shareProgress'),
        subtitle: t('command.linkage.shareProgress.sub'),
        icon: <Share2 size={18} />,
        category: linkageCategory,
        action: () => {
          onOpenShareProgress()
          onClose()
        },
      })
    }
    if (onOpenWeeklyRecap && fullLinkageCommands) {
      items.push({
        id: 'weekly-recap',
        title: t('command.weeklyRecap'),
        subtitle: t('command.weeklyRecap.sub'),
        icon: <BarChart3 size={18} />,
        category: linkageCategory,
        action: () => {
          onOpenWeeklyRecap()
          onClose()
        },
      })
    }
    return items
  }, [canSessionResume, currentPlan, fullLinkageCommands, onClose, onOpenShareProgress, onOpenWeeklyRecap, onRunAutopilotNext, onSessionResume, t])

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
      ...experienceCommands,
      ...workspaceModeCommands,
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
        id: 'go-to-definition',
        title: t('command.goToDefinition'),
        subtitle: t('command.goToDefinition.sub'),
        icon: <ArrowRightToLine size={18} />,
        shortcut: 'F12',
        category: t('command.cat.editor'),
        action: () => {
          onGoToDefinition()
          onClose()
        },
      },
      {
        id: 'go-to-references',
        title: t('command.goToReferences'),
        subtitle: t('command.goToReferences.sub'),
        icon: <Link2 size={18} />,
        shortcut: 'Shift+F12',
        category: t('command.cat.editor'),
        action: () => {
          onGoToReferences()
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
      ...(onOpenDebug
        ? [
            {
              id: 'open-debug-panel',
              title: t('command.debug.panel'),
              subtitle: t('command.debug.panel.sub'),
              icon: <Bug size={18} />,
              shortcut: 'Ctrl+Alt+4',
              category: t('command.cat.debug'),
              action: () => {
                onOpenDebug()
                onClose()
              },
            } satisfies Command,
          ]
        : []),
      ...(onStartDebug
        ? [
            {
              id: 'start-debug',
              title: t('command.debug.start'),
              subtitle: t('command.debug.start.sub'),
              icon: <Bug size={18} />,
              category: t('command.cat.debug'),
              action: () => {
                onStartDebug()
                onClose()
              },
            } satisfies Command,
            {
              id: 'stop-debug',
              title: t('command.debug.stop'),
              subtitle: t('command.debug.stop.sub'),
              icon: <Terminal size={18} />,
              shortcut: 'Shift+F5',
              category: t('command.cat.debug'),
              action: () => {
                onStopDebug?.()
                onClose()
              },
            } satisfies Command,
            {
              id: 'debug-continue',
              title: t('command.debug.continue'),
              subtitle: t('command.debug.continue.sub'),
              icon: <Play size={18} />,
              shortcut: 'F5',
              category: t('command.cat.debug'),
              action: () => {
                onDebugContinue?.()
                onClose()
              },
            } satisfies Command,
            {
              id: 'debug-step-over',
              title: t('command.debug.stepOver'),
              subtitle: t('command.debug.stepOver.sub'),
              icon: <ArrowDownToLine size={18} />,
              shortcut: 'F10',
              category: t('command.cat.debug'),
              action: () => {
                onDebugStepOver?.()
                onClose()
              },
            } satisfies Command,
            {
              id: 'debug-step-into',
              title: t('command.debug.stepInto'),
              subtitle: t('command.debug.stepInto.sub'),
              icon: <ArrowRightToLine size={18} />,
              shortcut: 'F11',
              category: t('command.cat.debug'),
              action: () => {
                onDebugStepInto?.()
                onClose()
              },
            } satisfies Command,
            {
              id: 'debug-step-out',
              title: t('command.debug.stepOut'),
              subtitle: t('command.debug.stepOut.sub'),
              icon: <ArrowUpFromLine size={18} />,
              shortcut: 'Shift+F11',
              category: t('command.cat.debug'),
              action: () => {
                onDebugStepOut?.()
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
      ...(onOpenSpecStudio || onRunFirstRunnableSpecTask
        ? [
            ...(onOpenSpecStudio
              ? [
                  {
                    id: 'spec-studio',
                    title: t('command.specStudio'),
                    subtitle: t('command.specStudio.sub'),
                    icon: <Sparkles size={18} />,
                    category: t('command.cat.spec'),
                    action: () => {
                      onOpenSpecStudio()
                      onClose()
                    },
                  } satisfies Command,
                ]
              : []),
            ...(onRunFirstRunnableSpecTask
              ? [
                  {
                    id: 'run-first-spec-task',
                    title: t('command.runFirstSpecTask'),
                    subtitle: t('command.runFirstSpecTask.sub'),
                    icon: <CheckSquare size={18} />,
                    category: t('command.cat.spec'),
                    action: () => {
                      onRunFirstRunnableSpecTask()
                      onClose()
                    },
                  } satisfies Command,
                ]
              : []),
          ]
        : []),
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
        shortcut: 'Ctrl+Shift+G',
        action: () => {
          onOpenGit()
          onClose()
        },
      },
      ...(onStageAll
        ? [
            {
              id: 'git-stage',
              title: t('command.git.stage'),
              subtitle: t('command.git.stage.sub'),
              icon: <GitBranch size={18} />,
              category: t('command.cat.collab'),
              action: () => {
                if (!gitStageAllDisabled) onStageAll()
                onClose()
              },
            } satisfies Command,
          ]
        : []),
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
      experienceCommands,
      workspaceModeCommands,
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
      onGoToDefinition,
      onGoToReferences,
      onRunCode,
      onSelectFile,
      onToggleAutoSave,
      onToggleTheme,
      onOpenTemplate,
      onOpenSpecStudio,
      onRunFirstRunnableSpecTask,
      onOpenWorkspaceImport,
      onOpenThemeSelector,
      onOpenWelcome,
      onOpenShareProgress,
      onRunAutopilotNext,
      onOpenDebug,
      onStartDebug,
      onStopDebug,
      onDebugContinue,
      onDebugStepOver,
      onDebugStepInto,
      onDebugStepOut,
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
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__search">
          <Search size={20} className="command-palette__search-icon" />
          <input
            type="text"
            className="command-palette__input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('command.placeholder')}
            autoFocus
          />
          <kbd className="status-pill">ESC</kbd>
        </div>

        <div className="command-palette__list">
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
                <div className="command-palette__category">{category}</div>
                {categoryCommands.map((command) => {
                  const currentIndex = commandIndex
                  const isSelected = currentIndex === selectedIndex
                  commandIndex += 1
                  return (
                    <button
                      key={command.id}
                      type="button"
                      className={`command-palette__item${isSelected ? ' command-palette__item--selected' : ''}`}
                      onClick={command.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <span className="command-palette__item-icon">{command.icon}</span>
                      <div className="command-palette__item-body">
                        <div className="command-palette__item-title">{command.title}</div>
                        {command.subtitle ? (
                          <div className="command-palette__item-subtitle">{command.subtitle}</div>
                        ) : null}
                      </div>
                      {command.shortcut ? <kbd className="status-pill">{command.shortcut}</kbd> : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette__footer">
          <span>{t('command.footer.enter')}</span>
          <span>{t('command.footer.navigate')}</span>
          <span>{t('command.footer.close')}</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
