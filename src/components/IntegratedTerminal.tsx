import { useCallback, useEffect, useRef, type FC } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { Play, Square, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { useWebContainerShell } from '../hooks/useWebContainerShell'
import {
  appendTerminalOutput,
  clearTerminalOutput,
  registerTerminalWriter,
  resizeShell,
  sendShellInput,
} from '../lib/terminalSession'
import { getDesktopApi, isDesktopApp } from '../services/desktopBridge'
import { isTerminalBridgeReady } from '../services/terminalBridge'

const DESKTOP_PROMPT = '$ '

interface IntegratedTerminalProps {
  embedded?: boolean
  layoutRevision?: number
  isReady: boolean
  isLoading: boolean
  isRunning: boolean
  readOnly?: boolean
  theme: 'vs-dark' | 'light'
  writeFile: (path: string, content: string) => Promise<void>
  onRun: () => void
  onClear: () => void
}

function getXtermTheme(theme: 'vs-dark' | 'light') {
  if (theme === 'light') {
    return {
      background: '#f8f9fb',
      foreground: '#1a1d26',
      cursor: '#2563eb',
      selectionBackground: '#2563eb44',
    }
  }
  return {
    background: '#0f1117',
    foreground: '#e6edf3',
    cursor: '#58a6ff',
    selectionBackground: '#58a6ff44',
  }
}

const IntegratedTerminal: FC<IntegratedTerminalProps> = ({
  embedded = false,
  layoutRevision = 0,
  isReady,
  isLoading,
  isRunning,
  readOnly = false,
  theme,
  writeFile,
  onRun,
  onClear,
}) => {
  const { t } = useI18n()
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const desktopLineRef = useRef('')
  const desktopBusyRef = useRef(false)
  const getProjectRootRef = useRef<() => string | null>(() => null)

  const fitTerminal = useCallback(() => {
    try {
      fitRef.current?.fit()
      const term = termRef.current
      if (term) resizeShell(term.cols, term.rows)
    } catch {
      /* host hidden */
    }
  }, [])

  useWebContainerShell({
    enabled: !readOnly && isReady && !isDesktopApp(),
    isReady,
    writeFile,
  })

  useEffect(() => {
    void import('../services/localProjectService').then((mod) => {
      getProjectRootRef.current = mod.getElectronRootPath
    })
  }, [])

  const runDesktopLine = useCallback(async (line: string) => {
    const api = getDesktopApi()
    if (!api || desktopBusyRef.current) return

    desktopBusyRef.current = true
    appendTerminalOutput(`\r\n${DESKTOP_PROMPT}${line}\r\n`)

    try {
      const root = getProjectRootRef.current?.() ?? ''
      const result = await api.runCommand(root, line)
      if (result.output) appendTerminalOutput(`${result.output}\r\n`)
      if (result.exitCode !== 0) {
        appendTerminalOutput(`(exit ${result.exitCode})\r\n`)
      }
    } catch (error) {
      appendTerminalOutput(`${error instanceof Error ? error.message : String(error)}\r\n`)
    } finally {
      desktopBusyRef.current = false
      appendTerminalOutput(DESKTOP_PROMPT)
    }
  }, [])

  useEffect(() => {
    if (!hostRef.current) return

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.35,
      theme: getXtermTheme(theme),
      disableStdin: readOnly,
      scrollback: 5000,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(hostRef.current)
    fitAddon.fit()
    fitTerminal()

    termRef.current = term
    fitRef.current = fitAddon

    registerTerminalWriter({
      write: (data) => term.write(data),
      clear: () => term.clear(),
    })

    if (isDesktopApp() && !readOnly) {
      term.writeln(t('terminal.desktopHint'))
      term.write(DESKTOP_PROMPT)
      term.onData((data) => {
        if (data === '\r') {
          const line = desktopLineRef.current.trim()
          desktopLineRef.current = ''
          term.write('\r\n')
          if (line) void runDesktopLine(line)
          else term.write(DESKTOP_PROMPT)
          return
        }
        if (data === '\u007f') {
          if (desktopLineRef.current.length > 0) {
            desktopLineRef.current = desktopLineRef.current.slice(0, -1)
            term.write('\b \b')
          }
          return
        }
        if (data === '\u0003') {
          appendTerminalOutput('^C\r\n')
          desktopLineRef.current = ''
          term.write(DESKTOP_PROMPT)
          return
        }
        desktopLineRef.current += data
        term.write(data)
      })
    } else if (!readOnly) {
      term.onData((data) => sendShellInput(data))
    }

    if (!isReady && !isLoading) {
      term.writeln('')
      term.writeln(t('terminal.hint'))
    }

    const resizeObserver = new ResizeObserver(() => {
      fitTerminal()
    })
    resizeObserver.observe(hostRef.current)

    return () => {
      resizeObserver.disconnect()
      registerTerminalWriter(null)
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [fitTerminal, isLoading, isReady, readOnly, runDesktopLine, t, theme])

  useEffect(() => {
    fitTerminal()
  }, [fitTerminal, layoutRevision])

  useEffect(() => {
    const term = termRef.current
    if (!term) return
    term.options.theme = getXtermTheme(theme)
    term.options.disableStdin = readOnly
  }, [readOnly, theme])

  const handleClear = () => {
    clearTerminalOutput()
    onClear()
    if (isDesktopApp() && !readOnly && isTerminalBridgeReady()) {
      appendTerminalOutput(DESKTOP_PROMPT)
    }
  }

  return (
    <div className={`integrated-terminal${embedded ? ' integrated-terminal--embedded' : ''}`}>
      <div className="integrated-terminal-toolbar">
        <span className="integrated-terminal-title">{t('terminal.title')}</span>
        <div className="integrated-terminal-actions">
          {!readOnly ? (
            <button
              type="button"
              className="integrated-terminal-btn integrated-terminal-btn-primary"
              onClick={onRun}
              disabled={isRunning || !isReady}
            >
              {isRunning ? <Square size={12} /> : <Play size={12} />}
              {isRunning ? t('terminal.running') : t('terminal.run')}
            </button>
          ) : null}
          <button type="button" className="integrated-terminal-btn" onClick={handleClear}>
            <Trash2 size={12} />
            {t('terminal.clear')}
          </button>
        </div>
      </div>
      <div className="integrated-terminal-body" ref={hostRef} />
      {readOnly ? <p className="integrated-terminal-readonly">{t('terminal.readOnly')}</p> : null}
    </div>
  )
}

export default IntegratedTerminal
