import { useCallback } from 'react'
import { type AIModel } from '../services/aiService'
import {
  clearTerminalOutput,
  getTerminalOutputLines,
  isShellInputReady,
  sendShellInput,
} from '../lib/terminalSession'
import { resultFromCommandOutcome, detectCommandOutcome, type NpmScriptRunResult } from '../lib/npmScriptRun'
import { waitForTerminalCommandOutcome } from '../lib/waitForTerminalCommandOutcome'
import { runTerminalCommand } from '../services/terminalBridge'
import { useIDEStore } from '../store/ideStore'
import { canUseDebugExecutionControls, isDebugSessionActive } from '../lib/debugSessionActive'
import { isCollaborationDebugBlocked } from '../lib/collabDebugGuard'
import {
  executeDebugContinue,
  executeDebugStepInto,
  executeDebugStepOut,
  executeDebugStepOver,
} from '../services/debugExecutionService'
import {
  startDebugSessionWithBreakpoints,
  stopActiveDebugSession,
} from '../services/debugSessionService'
import { StorageLayer, unifiedStorage } from '../services/unifiedStorage'
import type { TranslateFn } from '../i18n'
import type { FileItem } from '../types/file'

type Notify = (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void

interface UseEditorActionsOptions {
  activeFile: number
  files: FileItem[]
  isReady: boolean
  notify: Notify
  runNode: (entry?: string) => Promise<number | undefined>
  spawnNodeInspectSession: (
    entry?: string,
  ) => Promise<import('../hooks/useWebContainer').NodeInspectSessionHandle>
  setActiveFile: (index: number) => void
  setAiConfig: (config: { provider: AIModel; apiKey: string; model: string; endpoint: string }) => void
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  setShowAISettings: (show: boolean) => void
  setShowTemplateModal: (show: boolean) => void
  setShowTerminal: React.Dispatch<React.SetStateAction<boolean>>
  setTheme: (theme: 'vs-dark' | 'light') => void
  theme: 'vs-dark' | 'light'
  t: TranslateFn
  writeFile: (path: string, content: string) => Promise<void>
}

export function useEditorActions({
  activeFile,
  files,
  isReady,
  notify,
  runNode,
  spawnNodeInspectSession,
  setActiveFile,
  setAiConfig,
  setFiles,
  setShowAISettings,
  setShowTemplateModal,
  setShowTerminal,
  setTheme,
  theme,
  t,
  writeFile,
}: UseEditorActionsOptions) {
  const handleSaveAISettings = useCallback(
    async (config: { provider: AIModel; apiKey: string; model: string; endpoint: string }) => {
      setAiConfig(config)
      await unifiedStorage.set('ai-config', config)
      setShowAISettings(false)
      notify('success', t('notify.aiSettingsSaved'), t('notify.aiSettingsSavedDetail', { provider: config.provider, model: config.model }))
    },
    [notify, setAiConfig, setShowAISettings, t],
  )

  const handleApplyTemplate = useCallback(
    (templateFiles: FileItem[]) => {
      setFiles(templateFiles)
      setActiveFile(0)
      setShowTemplateModal(false)
      notify('success', t('notify.templateApplied'), t('notify.templateAppliedDetail', { count: templateFiles.length }))
    },
    [notify, setActiveFile, setFiles, setShowTemplateModal, t],
  )

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'vs-dark' ? 'light' : 'vs-dark'
    setTheme(newTheme)
    await unifiedStorage.set('theme', newTheme, { layer: StorageLayer.LOCAL })
    notify(
      'success',
      t('notify.themeSwitched'),
      newTheme === 'light' ? t('notify.themeLight') : t('notify.themeDark'),
    )
  }, [notify, setTheme, t, theme])

  const handleRunCode = useCallback(async () => {
    if (isDebugSessionActive(useIDEStore.getState().debugSession.phase)) {
      notify('info', t('debug.runBlockedTitle'), t('debug.runBlockedDetail'))
      return
    }

    if (!isReady) {
      notify('info', t('notify.runtimeInit'), t('notify.runtimeInitFile'))
      return
    }

    const file = files[activeFile]
    if (!file) return

    setShowTerminal(true)
    useIDEStore.getState().setBottomPanelTab('terminal')

    try {
      for (const workspaceFile of files) {
        await writeFile(workspaceFile.name, workspaceFile.content)
      }

      if (isShellInputReady()) {
        sendShellInput(`node ${file.name}\r`)
        return
      }

      const exitCode = await runNode(file.name)
      if (exitCode === 0) {
        notify('success', t('notify.runComplete'), file.name)
      } else if (typeof exitCode === 'number') {
        notify('error', t('notify.runFailed'), t('notify.runExitCode', { code: exitCode }))
      }
    } catch (error) {
      notify('error', t('notify.runFailed'), error instanceof Error ? error.message : t('notify.commandFailed'))
    }
  }, [activeFile, files, isReady, notify, runNode, setShowTerminal, t, writeFile])

  const clearTerminal = useCallback(() => {
    clearTerminalOutput()
  }, [])

  const notifyCollaborationDebugBlocked = useCallback(() => {
    notify('info', t('debug.viewerBlockedTitle'), t('debug.viewerBlockedDetail'))
  }, [notify, t])

  const handleStartDebug = useCallback(async () => {
    const storeSnapshot = useIDEStore.getState()
    if (
      isCollaborationDebugBlocked(
        storeSnapshot.collaborationRoomId,
        storeSnapshot.collaborationMemberRole,
      )
    ) {
      notifyCollaborationDebugBlocked()
      return
    }

    if (isDebugSessionActive(storeSnapshot.debugSession.phase)) {
      notify('info', t('debug.alreadyActiveTitle'), t('debug.alreadyActiveDetail'))
      return
    }

    if (!isReady) {
      notify('info', t('notify.runtimeInit'), t('debug.waitRuntimeDesc'))
      return
    }

    const file = files[activeFile]
    if (!file) return

    setShowTerminal(true)
    const store = useIDEStore.getState()
    store.setBottomPanelTab('debug')
    store.resetDebugSession()
    store.setDebugSession({
      phase: 'starting',
      entryFile: file.name,
      error: null,
      inspectUrl: null,
      syncMode: null,
      registeredBreakpointCount: 0,
      pausedAt: null,
      callStack: [],
      locals: [],
      activeStackFrameIndex: 0,
    })

    try {
      store.setDebugSession({ phase: 'listening' })
      const result = await startDebugSessionWithBreakpoints({
        files,
        entryFile: file.name,
        breakpoints: store.debugBreakpoints,
        writeFile,
        spawnInspect: (entry) => spawnNodeInspectSession(entry),
        onPaused: (inspection) => {
          const state = useIDEStore.getState()
          state.setDebugSession({
            phase: 'paused',
            pausedAt: inspection.location,
            callStack: inspection.callStack,
            locals: inspection.locals,
            activeStackFrameIndex: 0,
          })
          const fileIndex = files.findIndex((item) => item.name === inspection.location.path)
          if (fileIndex >= 0) {
            state.setActiveFile(fileIndex)
            state.setEditorTarget({ line: inspection.location.line, column: 1, nonce: Date.now() })
          }
        },
        onResumed: () => {
          useIDEStore.getState().setDebugSession({
            phase: 'running',
            pausedAt: null,
            callStack: [],
            locals: [],
            activeStackFrameIndex: 0,
          })
        },
        onEnded: () => {
          useIDEStore.getState().setDebugSession({ phase: 'ended' })
        },
      })

      if (!result.inspectUrl) {
        store.setDebugSession({
          phase: 'failed',
          error: t('debug.attachFailedNoUrl'),
        })
        notify('error', t('debug.attachFailed'), t('debug.attachFailedNoUrl'))
        return
      }

      store.setDebugSession({
        phase: result.syncMode === 'injected' ? 'running' : 'running',
        inspectUrl: result.inspectUrl,
        syncMode: result.syncMode,
        registeredBreakpointCount: result.registeredBreakpointCount,
      })

      if (result.syncMode === 'cdp') {
        notify(
          'success',
          t('debug.attachSuccess'),
          t('debug.breakpointsRegistered', { count: result.registeredBreakpointCount }),
        )
      } else if (result.syncMode === 'injected') {
        notify('info', t('debug.injectFallbackTitle'), t('debug.injectFallbackDetail'))
      } else {
        notify('success', t('debug.attachSuccess'), result.inspectUrl)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('notify.commandFailed')
      store.setDebugSession({ phase: 'failed', error: message })
      notify('error', t('debug.attachFailed'), message)
    }
  }, [activeFile, files, isReady, notify, notifyCollaborationDebugBlocked, setShowTerminal, spawnNodeInspectSession, t, writeFile])

  const handleStopDebug = useCallback(() => {
    stopActiveDebugSession()
    useIDEStore.getState().resetDebugSession()
    notify('info', t('debug.stopped'), t('debug.stoppedDetail'))
  }, [notify, t])

  const applyDebugRunningState = useCallback(() => {
    useIDEStore.getState().setDebugSession({
      phase: 'running',
      pausedAt: null,
      callStack: [],
      locals: [],
      activeStackFrameIndex: 0,
    })
  }, [])

  const runDebugExecution = useCallback(
    async (action: () => Promise<boolean>, failureKey: 'debug.executionFailed' | 'debug.executionRequiresCdp') => {
      const storeSnapshot = useIDEStore.getState()
      if (
        isCollaborationDebugBlocked(
          storeSnapshot.collaborationRoomId,
          storeSnapshot.collaborationMemberRole,
        )
      ) {
        notifyCollaborationDebugBlocked()
        return
      }

      const session = storeSnapshot.debugSession
      if (!canUseDebugExecutionControls(session)) {
        notify('info', t('debug.executionRequiresCdpTitle'), t(failureKey))
        return
      }
      try {
        const ok = await action()
        if (ok) {
          applyDebugRunningState()
        } else {
          notify('error', t('debug.executionFailedTitle'), t('debug.executionFailed'))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('debug.executionFailed')
        notify('error', t('debug.executionFailedTitle'), message)
      }
    },
    [applyDebugRunningState, notify, notifyCollaborationDebugBlocked, t],
  )

  const handleDebugContinue = useCallback(async () => {
    await runDebugExecution(executeDebugContinue, 'debug.executionRequiresCdp')
  }, [runDebugExecution])

  const handleDebugStepOver = useCallback(async () => {
    await runDebugExecution(executeDebugStepOver, 'debug.executionRequiresCdp')
  }, [runDebugExecution])

  const handleDebugStepInto = useCallback(async () => {
    await runDebugExecution(executeDebugStepInto, 'debug.executionRequiresCdp')
  }, [runDebugExecution])

  const handleDebugStepOut = useCallback(async () => {
    await runDebugExecution(executeDebugStepOut, 'debug.executionRequiresCdp')
  }, [runDebugExecution])

  const handleRunNpmScript = useCallback(
    async (scriptName: string): Promise<NpmScriptRunResult> => {
      if (isDebugSessionActive(useIDEStore.getState().debugSession.phase)) {
        notify('info', t('debug.runBlockedTitle'), t('debug.runBlockedDetail'))
        return { scriptName, status: 'skipped', detail: t('debug.runBlockedDetail') }
      }

      if (!isReady) {
        notify('info', t('notify.runtimeInit'), t('notify.runtimeInitNpm'))
        return { scriptName, status: 'skipped', detail: t('notify.runtimeInitNpm') }
      }

      setShowTerminal(true)
      useIDEStore.getState().setBottomPanelTab('terminal')

      try {
        for (const workspaceFile of files) {
          await writeFile(workspaceFile.name, workspaceFile.content)
        }

        if (isShellInputReady()) {
          const baselineLineCount = getTerminalOutputLines().length
          sendShellInput(`npm run ${scriptName}\r`)
          const outcome = await waitForTerminalCommandOutcome({ baselineLineCount })
          const result = outcome.timedOut && outcome.exitCode === undefined && !outcome.failed
            ? {
                scriptName,
                status: 'error' as const,
                detail: t('notify.scriptTimeoutDetail', { script: scriptName }),
              }
            : resultFromCommandOutcome(
                scriptName,
                outcome,
                outcome.timedOut ? t('notify.scriptTimeoutDetail', { script: scriptName }) : undefined,
              )

          if (result.status === 'error') {
            notify(
              'error',
              t('notify.scriptFailed'),
              result.detail
                ?? (result.exitCode !== undefined
                  ? t('notify.scriptExitCode', { code: result.exitCode, script: scriptName })
                  : t('notify.scriptRanDetail', { script: scriptName })),
            )
          } else {
            notify('success', t('notify.scriptRan'), t('notify.scriptRanDetail', { script: scriptName }))
          }
          return result
        }

        const output = await runTerminalCommand(`npm run ${scriptName}`)
        const exitMatch = output.match(/\(exit (\d+)\)/)
        const exitCode = exitMatch ? Number(exitMatch[1]) : undefined
        const failed = exitMatch ? exitCode !== 0 : detectCommandOutcome(output.split('\n')).failed
        const result = resultFromCommandOutcome(
          scriptName,
          { exitCode, failed },
          output.slice(0, 200) || undefined,
        )

        if (result.status === 'error') {
          notify(
            'error',
            t('notify.scriptFailed'),
            result.detail || t('notify.scriptRanDetail', { script: scriptName }),
          )
        } else {
          notify('success', t('notify.scriptRan'), t('notify.scriptRanDetail', { script: scriptName }))
        }
        return result
      } catch (error) {
        const detail = error instanceof Error ? error.message : t('notify.commandFailed')
        notify('error', t('notify.scriptFailed'), detail)
        return { scriptName, status: 'error', detail }
      }
    },
    [files, isReady, notify, setShowTerminal, t, writeFile],
  )

  return {
    clearTerminal,
    handleApplyTemplate,
    handleRunCode,
    handleStartDebug,
    handleStopDebug,
    handleDebugContinue,
    handleDebugStepOver,
    handleDebugStepInto,
    handleDebugStepOut,
    handleRunNpmScript,
    handleSaveAISettings,
    toggleTheme,
  }
}
