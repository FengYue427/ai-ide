import type { ReactNode } from 'react'
import type { Language } from '../i18n'

export type { ExtendedPluginPermission as PluginPermission } from './pluginPermissions'
export { ALL_PLUGIN_PERMISSIONS } from './pluginPermissions'

/** Author-provided UI strings per app locale (keys are plugin-defined, e.g. `toolbar.label`). */
export type PluginI18nTable = Partial<Record<Language, Record<string, string>>>

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author?: string
  icon?: string
  entry: string
  permissions: string[]
  /** Optional localized strings resolved via `context.t(key)` in plugin source. */
  i18n?: PluginI18nTable
}

export interface PluginContext {
  /** App UI language (zh-CN | en-US). */
  locale: Language
  /**
   * Resolve a string from `manifest.i18n` for the current locale, then zh-CN, else return `key`.
   * Supports `{param}` placeholders in manifest values.
   */
  t: (key: string, params?: Record<string, string | number>) => string
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
