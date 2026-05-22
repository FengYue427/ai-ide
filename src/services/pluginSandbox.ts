import type { PluginContext, PluginManifest } from './pluginTypes'
import {
  hasAi,
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
    return '插件 id 须为小写字母/数字/连字符，且以字母开头'
  }
  if (!manifest.name?.trim()) return '插件名称不能为空'
  if (!manifest.version?.trim()) return '插件版本不能为空'
  return validateExtendedPermissions(manifest.permissions)
}

export function validatePluginSource(source: string): string | null {
  if (!source.trim()) return '插件代码不能为空'
  if (source.length > 32_000) return '插件代码超过 32KB 限制'
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(source)) {
      return `插件代码包含不允许的模式: ${pattern.source}`
    }
  }
  return null
}

function deny<T extends string>(name: T): () => never {
  return () => {
    throw new Error(`插件无权访问 ${name}`)
  }
}

export function createSandboxedContext(
  base: PluginContext,
  permissions: readonly string[],
): PluginContext {
  const perms = new Set(normalizePluginPermissions(permissions))

  return {
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
              throw new Error('插件无权执行该终端命令（仅允许安全命令白名单）')
            }
            return base.terminal.execute(command)
          }
        : deny('terminal.execute'),
    },
    ai: {
      complete: hasAi(perms) ? base.ai.complete : deny('ai.complete'),
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
    throw new Error('生产环境禁止在主线程执行插件代码，请使用 Worker 沙箱')
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
  throw new Error("插件须定义 activate(context) 函数");
}`,
  ) as (context: PluginContext) => void

  runner(context)
}
