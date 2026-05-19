import {
  ALL_PLUGIN_PERMISSIONS,
  type PluginContext,
  type PluginManifest,
  type PluginPermission,
} from './pluginTypes'

export { ALL_PLUGIN_PERMISSIONS, type PluginPermission }

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
]

export function validateManifest(manifest: PluginManifest): string | null {
  if (!manifest.id || !/^[a-z][a-z0-9-]{1,48}$/.test(manifest.id)) {
    return '插件 id 须为小写字母/数字/连字符，且以字母开头'
  }
  if (!manifest.name?.trim()) return '插件名称不能为空'
  if (!manifest.version?.trim()) return '插件版本不能为空'
  if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
    return '至少声明一项权限'
  }
  for (const perm of manifest.permissions) {
    if (!ALL_PLUGIN_PERMISSIONS.includes(perm as PluginPermission)) {
      return `未知权限: ${perm}`
    }
  }
  return null
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
  permissions: PluginPermission[],
): PluginContext {
  const allowed = new Set(permissions)

  return {
    editor: allowed.has('editor')
      ? base.editor
      : {
          getValue: deny('editor.getValue'),
          setValue: deny('editor.setValue'),
          getSelectedText: deny('editor.getSelectedText'),
          insertText: deny('editor.insertText'),
        },
    files: allowed.has('files')
      ? base.files
      : {
          getAll: deny('files.getAll'),
          getActive: deny('files.getActive'),
          create: deny('files.create'),
          open: deny('files.open'),
        },
    terminal: allowed.has('terminal')
      ? base.terminal
      : {
          execute: deny('terminal.execute'),
          getHistory: deny('terminal.getHistory'),
        },
    ai: allowed.has('ai')
      ? base.ai
      : {
          complete: deny('ai.complete'),
        },
    ui: allowed.has('ui')
      ? base.ui
      : {
          showNotification: deny('ui.showNotification'),
          showModal: deny('ui.showModal'),
          addToolbarButton: deny('ui.addToolbarButton'),
        },
  }
}

export function runPluginActivate(source: string, context: PluginContext): void {
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
