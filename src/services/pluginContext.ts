import { sendMessage, type AIConfig } from './aiService'
import type { PluginContext } from './pluginService'
import type { FileItem } from '../types/file'
import { getLanguageFromExt } from '../app/getLanguageFromExt'

export interface PluginHostDeps {
  getFiles: () => FileItem[]
  getActiveFileIndex: () => number
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void
  setActiveFile: (index: number) => void
  getAiConfig: () => AIConfig
  notify: (message: string, type?: 'info' | 'success' | 'error') => void
  showModal: (title: string, body: string) => void
  addToolbarButton: (
    pluginId: string,
    config: { icon: string; label: string; onClick: () => void },
  ) => void
  runTerminal?: (command: string) => Promise<string>
  getTerminalHistory?: () => string[]
}

export function createPluginContext(deps: PluginHostDeps): PluginContext {
  const readActive = () => {
    const files = deps.getFiles()
    const index = deps.getActiveFileIndex()
    return files[index] ?? null
  }

  return {
    editor: {
      getValue: () => readActive()?.content ?? '',
      setValue: (value) => {
        deps.setFiles((prev) => {
          const index = deps.getActiveFileIndex()
          if (!prev[index]) return prev
          const next = [...prev]
          next[index] = { ...next[index], content: value }
          return next
        })
      },
      getSelectedText: () => null,
      insertText: (text) => {
        const active = readActive()
        if (!active) return
        deps.setFiles((prev) => {
          const index = deps.getActiveFileIndex()
          if (!prev[index]) return prev
          const next = [...prev]
          next[index] = { ...next[index], content: active.content + text }
          return next
        })
      },
    },
    files: {
      getAll: () => deps.getFiles(),
      getActive: () => readActive(),
      create: (name, content) => {
        deps.setFiles((prev) => {
          const next = [...prev, { name, content, language: getLanguageFromExt(name) }]
          deps.setActiveFile(next.length - 1)
          return next
        })
      },
      open: (name) => {
        const index = deps.getFiles().findIndex((file) => file.name === name)
        if (index >= 0) deps.setActiveFile(index)
      },
    },
    terminal: {
      execute: async (command) => {
        if (!deps.runTerminal) {
          throw new Error('终端尚未就绪')
        }
        return deps.runTerminal(command)
      },
      getHistory: () => deps.getTerminalHistory?.() ?? [],
    },
    ai: {
      complete: async (prompt) => {
        const config = deps.getAiConfig()
        if (!config.apiKey?.trim() && config.provider !== 'ollama') {
          throw new Error('请先在 AI 设置中配置 API Key')
        }
        return sendMessage(config, [{ role: 'user', content: prompt }])
      },
    },
    ui: {
      showNotification: (message, type = 'info') => deps.notify(message, type),
      showModal: (title, content) => {
        const body = typeof content === 'string' ? content : String(content)
        deps.showModal(title, body)
      },
      addToolbarButton: (config, pluginId) => {
        if (!pluginId) {
          throw new Error('插件工具栏按钮未绑定 pluginId')
        }
        deps.addToolbarButton(pluginId, config)
      },
    },
  }
}
