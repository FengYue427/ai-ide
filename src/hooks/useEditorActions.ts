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

  const handleRunNpmScript = useCallback(
    async (scriptName: string): Promise<NpmScriptRunResult> => {
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
    handleRunNpmScript,
    handleSaveAISettings,
    toggleTheme,
  }
}
