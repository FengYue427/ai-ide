import { useEffect, type CSSProperties, type FC, type ReactNode } from 'react'
import { CheckSquare, Package, TerminalSquare } from 'lucide-react'
import { useI18n } from '../i18n'
import { useBottomPanelPersistence } from '../hooks/useBottomPanelPersistence'
import { useBottomPanelResize } from '../hooks/useBottomPanelResize'
import { clampBottomPanelHeight } from '../lib/bottomPanelPrefs'
import { useIDEStore, type BottomPanelTab } from '../store/ideStore'
import IntegratedTerminal from './IntegratedTerminal'
import { NpmScriptsPanel } from './NpmScriptsPanel'
import { TasksPanel } from './TasksPanel'

interface BottomPanelProps {
  isReady: boolean
  isLoading: boolean
  isRunning: boolean
  readOnly?: boolean
  theme: 'vs-dark' | 'light'
  writeFile: (path: string, content: string) => Promise<void>
  onRunCode: () => void
  onClearTerminal: () => void
  onRunNpmScript: (scriptName: string) => void | Promise<void>
  onOpenPackageJson?: () => void
  onOpenTaskFile: (path: string, line?: number) => void
  onCreateProjectTasks: () => void
  onSendOpenTasksToAgent: () => void
}

const TAB_ICONS: Record<BottomPanelTab, typeof TerminalSquare> = {
  terminal: TerminalSquare,
  scripts: Package,
  tasks: CheckSquare,
}

const BottomPanel: FC<BottomPanelProps> = ({
  isReady,
  isLoading,
  isRunning,
  readOnly = false,
  theme,
  writeFile,
  onRunCode,
  onClearTerminal,
  onRunNpmScript,
  onOpenPackageJson,
  onOpenTaskFile,
  onCreateProjectTasks,
  onSendOpenTasksToAgent,
}) => {
  const { t } = useI18n()
  const tab = useIDEStore((s) => s.bottomPanelTab)
  const height = useIDEStore((s) => s.bottomPanelHeight)
  const setBottomPanelTab = useIDEStore((s) => s.setBottomPanelTab)
  const setBottomPanelHeight = useIDEStore((s) => s.setBottomPanelHeight)

  useBottomPanelPersistence()

  const {
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeDoubleClick,
  } = useBottomPanelResize(height, setBottomPanelHeight)

  useEffect(() => {
    const onWindowResize = () => {
      const current = useIDEStore.getState().bottomPanelHeight
      const clamped = clampBottomPanelHeight(current)
      if (clamped !== current) setBottomPanelHeight(clamped)
    }
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [setBottomPanelHeight])

  const panelStyle: CSSProperties = {
    height: `${height}px`,
    flexShrink: 0,
  }

  const tabs: { id: BottomPanelTab; label: string }[] = [
    { id: 'terminal', label: t('bottomPanel.tab.terminal') },
    { id: 'scripts', label: t('bottomPanel.tab.scripts') },
    { id: 'tasks', label: t('bottomPanel.tab.tasks') },
  ]

  const handleRunScript = (scriptName: string) => {
    setBottomPanelTab('terminal')
    return onRunNpmScript(scriptName)
  }

  const panes: Record<BottomPanelTab, ReactNode> = {
    terminal: (
      <IntegratedTerminal
        embedded
        isReady={isReady}
        isLoading={isLoading}
        isRunning={isRunning}
        readOnly={readOnly}
        theme={theme}
        writeFile={writeFile}
        onRun={onRunCode}
        onClear={onClearTerminal}
      />
    ),
    scripts: (
      <NpmScriptsPanel
        isReady={isReady}
        isRunning={isRunning}
        readOnly={readOnly}
        onRunScript={handleRunScript}
        onOpenPackageJson={onOpenPackageJson}
      />
    ),
    tasks: (
      <TasksPanel
        readOnly={readOnly}
        onOpenTaskFile={onOpenTaskFile}
        onCreateProjectTasks={onCreateProjectTasks}
        onSendOpenTasksToAgent={onSendOpenTasksToAgent}
      />
    ),
  }

  return (
    <div className="bottom-panel" style={panelStyle}>
      <div
        className="bottom-panel-resize-handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label={t('bottomPanel.resize')}
        title={t('bottomPanel.resizeHint')}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        onDoubleClick={onResizeDoubleClick}
      />
      <div className="bottom-panel-tabs" role="tablist" aria-label={t('bottomPanel.ariaLabel')}>
        {tabs.map((item) => {
          const Icon = TAB_ICONS[item.id]
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`bottom-panel-tab${active ? ' bottom-panel-tab--active' : ''}`}
              onClick={() => setBottomPanelTab(item.id)}
            >
              <Icon size={14} />
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="bottom-panel-body" role="tabpanel">
        {panes[tab]}
      </div>
    </div>
  )
}

export default BottomPanel
