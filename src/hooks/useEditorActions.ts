import { useCallback } from 'react'
import { type AIModel } from '../services/aiService'
import { runTerminalCommand } from '../services/terminalBridge'
import { StorageLayer, unifiedStorage } from '../services/unifiedStorage'
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
  writeFile,
}: UseEditorActionsOptions) {
  const handleSaveAISettings = useCallback(
    async (config: { provider: AIModel; apiKey: string; model: string; endpoint: string }) => {
      setAiConfig(config)
      await unifiedStorage.set('ai-config', config)
      setShowAISettings(false)
      notify('success', 'AI 设置已保存', `${config.provider} / ${config.model}`)
    },
    [notify, setAiConfig, setShowAISettings],
  )

  const handleApplyTemplate = useCallback(
    (templateFiles: FileItem[]) => {
      setFiles(templateFiles)
      setActiveFile(0)
      setShowTemplateModal(false)
      notify('success', '模板已应用', `已生成 ${templateFiles.length} 个文件。`)
    },
    [notify, setActiveFile, setFiles, setShowTemplateModal],
  )

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'vs-dark' ? 'light' : 'vs-dark'
    setTheme(newTheme)
    await unifiedStorage.set('theme', newTheme, { layer: StorageLayer.LOCAL })
    notify('success', '主题已切换', newTheme === 'light' ? '浅色模式' : '深色模式')
  }, [notify, setTheme, theme])

  const handleRunCode = useCallback(async () => {
    if (!isReady) {
      notify('info', '运行环境仍在初始化', 'WebContainer 准备好后即可运行当前文件。')
      return
    }

    const file = files[activeFile]
    if (!file) return

    setShowTerminal(true)

    try {
      for (const workspaceFile of files) {
        await writeFile(workspaceFile.name, workspaceFile.content)
      }

      const exitCode = await runNode(file.name)
      if (exitCode === 0) {
        notify('success', '运行完成', file.name)
      } else if (typeof exitCode === 'number') {
        notify('error', '运行失败', `进程退出码：${exitCode}`)
      }
    } catch (error) {
      notify('error', '运行失败', error instanceof Error ? error.message : '命令执行失败')
    }
  }, [activeFile, files, isReady, notify, runNode, setShowTerminal, writeFile])

  const clearTerminal = useCallback(() => {
    setShowTerminal(false)
    window.setTimeout(() => setShowTerminal(true), 10)
  }, [setShowTerminal])

  const handleRunNpmScript = useCallback(
    async (scriptName: string) => {
      if (!isReady) {
        notify('info', '运行环境仍在初始化', 'WebContainer 准备好后即可运行 npm scripts。')
        return
      }

      setShowTerminal(true)

      try {
        for (const workspaceFile of files) {
          await writeFile(workspaceFile.name, workspaceFile.content)
        }

        const output = await runTerminalCommand(`npm run ${scriptName}`)
        if (output.includes('(exit') && !output.includes('(exit 0)')) {
          notify('error', '脚本执行失败', output.slice(0, 200) || `npm run ${scriptName}`)
        } else {
          notify('success', '脚本已执行', `npm run ${scriptName}`)
        }
      } catch (error) {
        notify('error', '脚本执行失败', error instanceof Error ? error.message : '命令执行失败')
      }
    },
    [files, isReady, notify, setShowTerminal, writeFile],
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
