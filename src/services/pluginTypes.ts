import type { ReactNode } from 'react'

export type { ExtendedPluginPermission as PluginPermission } from './pluginPermissions'
export { ALL_PLUGIN_PERMISSIONS } from './pluginPermissions'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author?: string
  icon?: string
  entry: string
  permissions: string[]
}

export interface PluginContext {
  editor: {
    getValue: () => string
    setValue: (value: string) => void
    getSelectedText: () => string | null
    insertText: (text: string, position?: number) => void
  }
  files: {
    getAll: () => { name: string; content: string; language: string }[]
    getActive: () => { name: string; content: string; language: string } | null
    create: (name: string, content: string) => void
    open: (name: string) => void
  }
  terminal: {
    execute: (command: string) => Promise<string>
    getHistory: () => string[]
  }
  ai: {
    complete: (prompt: string) => Promise<string>
  }
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'error') => void
    showModal: (title: string, content: ReactNode) => void
    addToolbarButton: (
      config: { icon: string; label: string; onClick: () => void },
      pluginId?: string,
    ) => void
  }
}
