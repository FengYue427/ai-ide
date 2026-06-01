import type { PluginContext, PluginManifest } from './pluginTypes'
import { pluginError } from './pluginErrors'
import { validatePluginI18n } from './pluginI18n'
import {
  hasAi,
  hasDebugRead,
  hasEditorRead,
  hasEditorWrite,
  hasFilesRead,
  hasFilesWrite,
  hasTerminalAny,
  hasTerminalFull,
  hasUi,
  normalizePluginPermissions,
  validateExtendedPermissions,
} from './pluginPermissions'
import { isTerminalCommandAllowed } from './pluginTerminalPolicy'

export { ALL_PLUGIN_PERMISSIONS } from './pluginPermissions'
export type { ExtendedPluginPermission as PluginPermission } from './pluginPermissions'

const BLOCKED_PATTERNS: RegExp[] = [
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\bimport\s*\(/,
  /\brequire\s*\(/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bdocument\s*\./,
  /\bwindow\s*\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /__proto__/,
  /\bprocess\b/,
  /\bconstructor\s*\(/,
  /\b__defineGetter__\b/,
  /\b__defineSetter__\b/,
  /\bProxy\b/,
  /\bReflect\b/,
  /\bglobalThis\b/,
  /\bpostMessage\s*\(/,
  /\bimportScripts\b/,
  /\bWebSocket\b/,
]

export function validateManifest(manifest: PluginManifest): string | null {
  if (!manifest.id || !/^[a-z][a-z0-9-]{1,48}$/.test(manifest.id)) {
    return pluginError('plugin.sandbox.invalidId')
  }
  if (!manifest.name?.trim()) return pluginError('plugin.sandbox.nameRequired')
  if (!manifest.version?.trim()) return pluginError('plugin.sandbox.versionRequired')
  const permError = validateExtendedPermissions(manifest.permissions)
  if (permError) return permError
  if (manifest.sdkVersion != null) {
    if (!Number.isInteger(manifest.sdkVersion) || manifest.sdkVersion < 1 || manifest.sdkVersion > 2) {
      return pluginError('plugin.sandbox.invalidSdkVersion')
    }
  }
  return validatePluginI18n(manifest.i18n)
}

export function validatePluginSource(source: string): string | null {
  if (!source.trim()) return pluginError('plugin.sandbox.codeEmpty')
  if (source.length > 32_000) return pluginError('plugin.sandbox.codeTooLarge')
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(source)) {
      return pluginError('plugin.sandbox.blockedPattern', { pattern: pattern.source })
    }
  }
  return null
}

function deny<T extends string>(name: T): () => never {
  return () => {
    throw new Error(pluginError('plugin.sandbox.denied', { name }))
  }
}

export function createSandboxedContext(
  base: PluginContext,
  permissions: readonly string[],
): PluginContext {
  const perms = new Set(normalizePluginPermissions(permissions))

  return {
    locale: base.locale,
    t: base.t,
    editor: {
      getValue: hasEditorRead(perms) ? base.editor.getValue : deny('editor.getValue'),
      getSelectedText: hasEditorRead(perms) ? base.editor.getSelectedText : deny('editor.getSelectedText'),
      setValue: hasEditorWrite(perms) ? base.editor.setValue : deny('editor.setValue'),
      insertText: hasEditorWrite(perms) ? base.editor.insertText : deny('editor.insertText'),
    },
    files: {
      getAll: hasFilesRead(perms) ? base.files.getAll : deny('files.getAll'),
      getActive: hasFilesRead(perms) ? base.files.getActive : deny('files.getActive'),
      open: hasFilesRead(perms) ? base.files.open : deny('files.open'),
      create: hasFilesWrite(perms) ? base.files.create : deny('files.create'),
    },
    terminal: {
      getHistory: hasTerminalAny(perms) ? base.terminal.getHistory : deny('terminal.getHistory'),
      execute: hasTerminalAny(perms)
        ? async (command: string) => {
            const mode =
              !import.meta.env.PROD && hasTerminalFull(perms) ? 'full' : 'safe'
            if (!isTerminalCommandAllowed(command, mode)) {
              throw new Error(pluginError('plugin.sandbox.terminalCommandDenied'))
            }
            return base.terminal.execute(command)
          }
        : deny('terminal.execute'),
    },
    ai: {
      complete: hasAi(perms) ? base.ai.complete : deny('ai.complete'),
      getMode: hasAi(perms) ? base.ai.getMode : deny('ai.getMode'),
    },
    debug: {
      getSummary: hasDebugRead(perms) ? base.debug.getSummary : deny('debug.getSummary'),
    },
    ui: {
      showNotification: hasUi(perms) ? base.ui.showNotification : deny('ui.showNotification'),
      showModal: hasUi(perms) ? base.ui.showModal : deny('ui.showModal'),
      addToolbarButton: hasUi(perms) ? base.ui.addToolbarButton : deny('ui.addToolbarButton'),
    },
  }
}

/** @deprecated Third-party plugins should use runPluginActivateInSandbox (Worker). */
export function runPluginActivate(source: string, context: PluginContext): void {
  if (import.meta.env.PROD) {
    throw new Error(pluginError('plugin.sandbox.prodMainThread'))
  }
  const error = validatePluginSource(source)
  if (error) throw new Error(error)

  const runner = new Function(
    'context',
    `"use strict";
${source}
if (typeof activate === "function") {
  activate(context);
} else {
  throw new Error(pluginError('plugin.sandbox.activateRequired'));
}`,
  ) as (context: PluginContext) => void

  runner(context)
}
