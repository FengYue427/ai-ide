import { useEffect } from 'react'
import { useI18n } from '../i18n'
import { createPluginContext } from '../services/pluginContext'
import { createBuiltinPlugins, pluginManager } from '../services/pluginService'
import { loadInstalledPluginPackages } from '../services/pluginStorage'
import { runTerminalCommand } from '../services/terminalBridge'
import { useIDEStore, type PluginToolbarButton } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'

interface UsePluginHostOptions {
  notify: (kind: ToastKind, title: string, detail?: string) => void
  terminalOutput?: string[]
}

const BUILTIN_PLUGIN_IDS = ['format-code', 'line-count'] as const

export function usePluginHost({ notify, terminalOutput = [] }: UsePluginHostOptions) {
  const { language } = useI18n()

  useEffect(() => {
    const context = createPluginContext({
      getFiles: () => useIDEStore.getState().files,
      getActiveFileIndex: () => useIDEStore.getState().activeFile,
      setFiles: (updater) => useIDEStore.getState().setFiles(updater),
      setActiveFile: (index) => useIDEStore.getState().setActiveFile(index),
      getAiConfig: () => useIDEStore.getState().aiConfig,
      notify: (message, type = 'info') => notify(type, message),
      showModal: (title, body) => useIDEStore.getState().setPluginModal({ title, body }),
      addToolbarButton: (pluginId, config) => {
        const button: PluginToolbarButton = {
          id: `${pluginId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          pluginId,
          icon: config.icon,
          label: config.label,
          onClick: config.onClick,
        }
        useIDEStore.getState().addPluginToolbarButton(button)
      },
      runTerminal: runTerminalCommand,
      getTerminalHistory: () => terminalOutput,
    })

    pluginManager.setContext(context)
    pluginManager.setOnDeactivate((pluginId) => {
      useIDEStore.getState().clearPluginToolbarButtons(pluginId)
    })

    const init = async () => {
      BUILTIN_PLUGIN_IDS.forEach((id) => {
        if (pluginManager.isActive(id)) pluginManager.deactivate(id)
        pluginManager.unload(id)
      })
      createBuiltinPlugins(language).forEach((plugin) => pluginManager.register(plugin))
      const packages = await loadInstalledPluginPackages()
      packages.forEach((pkg) => pluginManager.registerPackage(pkg))
    }

    void init()

    return () => {
      pluginManager.getActivePlugins().forEach((plugin) => pluginManager.deactivate(plugin.id))
    }
  }, [language, notify, terminalOutput])
}
