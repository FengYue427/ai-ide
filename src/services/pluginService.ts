import { ALL_PLUGIN_PERMISSIONS, hasUi, normalizePluginPermissions } from './pluginPermissions'
import {
  createSandboxedContext,
  validateManifest,
  validatePluginSource,
} from './pluginSandbox'
import { runPluginActivateInSandbox, type PluginSandboxHandle } from './pluginSandboxRunner'
import type { PluginContext, PluginManifest } from './pluginTypes'

export type { PluginContext, PluginManifest } from './pluginTypes'

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author?: string
  icon?: string
  manifest?: PluginManifest
  builtin?: boolean
  activate: (context: PluginContext) => void | Promise<void>
  deactivate?: () => void
}

export interface PluginPackage {
  manifest: PluginManifest
  source: string
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private activePlugins: Map<string, Plugin> = new Map()
  private sandboxHandles: Map<string, PluginSandboxHandle> = new Map()
  private context: PluginContext | null = null
  private onDeactivate?: (pluginId: string) => void

  setContext(context: PluginContext) {
    this.context = context
  }

  setOnDeactivate(handler: (pluginId: string) => void) {
    this.onDeactivate = handler
  }

  register(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`)
      return false
    }
    this.plugins.set(plugin.id, plugin)
    return true
  }

  registerPackage(pkg: PluginPackage): { ok: true } | { ok: false; error: string } {
    const manifestError = validateManifest(pkg.manifest)
    if (manifestError) return { ok: false, error: manifestError }

    const sourceError = validatePluginSource(pkg.source)
    if (sourceError) return { ok: false, error: sourceError }

    const plugin: Plugin = {
      id: pkg.manifest.id,
      name: pkg.manifest.name,
      version: pkg.manifest.version,
      description: pkg.manifest.description,
      author: pkg.manifest.author,
      icon: pkg.manifest.icon,
      manifest: pkg.manifest,
      activate: async (context) => {
        const handle = await runPluginActivateInSandbox(
          pkg.manifest.id,
          pkg.source,
          context,
          pkg.manifest.permissions,
          {
            onRegisterButton: ({ icon, label, onClick }) => {
              context.ui.addToolbarButton({ icon, label, onClick }, pkg.manifest.id)
            },
          },
        )
        this.sandboxHandles.set(pkg.manifest.id, handle)
      },
    }

    if (this.plugins.has(plugin.id)) {
      void this.deactivate(plugin.id)
      this.plugins.delete(plugin.id)
    }

    this.register(plugin)
    return { ok: true }
  }

  private buildActivationContext(plugin: Plugin): PluginContext | null {
    if (!this.context) return null

    const permissions: string[] = plugin.builtin
      ? [...ALL_PLUGIN_PERMISSIONS]
      : plugin.manifest?.permissions ?? []

    const sandboxed = createSandboxedContext(this.context, permissions)
    const pluginId = plugin.id

    return {
      ...sandboxed,
      ui: {
        ...sandboxed.ui,
        addToolbarButton: (config) => {
          if (!hasUi(new Set(normalizePluginPermissions(permissions)))) {
            throw new Error('插件无权访问 ui.addToolbarButton')
          }
          this.context!.ui.addToolbarButton(config, pluginId)
        },
      },
    }
  }

  async activate(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false
    if (this.activePlugins.has(pluginId)) return false

    const activationContext = this.buildActivationContext(plugin)
    if (!activationContext) return false

    try {
      await plugin.activate(activationContext)
      this.activePlugins.set(pluginId, plugin)
      return true
    } catch (error) {
      this.disposeSandbox(pluginId)
      console.error(`Failed to activate plugin ${pluginId}:`, error)
      return false
    }
  }

  private disposeSandbox(pluginId: string): void {
    const handle = this.sandboxHandles.get(pluginId)
    if (handle) {
      handle.dispose()
      this.sandboxHandles.delete(pluginId)
    }
  }

  deactivate(pluginId: string): boolean {
    const plugin = this.activePlugins.get(pluginId)
    if (!plugin) return false

    try {
      plugin.deactivate?.()
      this.disposeSandbox(pluginId)
      this.activePlugins.delete(pluginId)
      this.onDeactivate?.(pluginId)
      return true
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error)
      return false
    }
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.activePlugins.values())
  }

  isActive(pluginId: string): boolean {
    return this.activePlugins.has(pluginId)
  }

  async loadPlugin(input: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = input.trim()
    if (!trimmed) return { ok: false, error: '请输入插件包 JSON' }

    if (import.meta.env.PROD) {
      return { ok: false, error: '生产环境默认禁用第三方插件（仅允许内置插件）' }
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('npm:')) {
      return { ok: false, error: '远程插件加载尚未开放，请粘贴插件 JSON 包' }
    }

    try {
      const pkg = JSON.parse(trimmed) as PluginPackage
      if (!pkg.manifest || !pkg.source) {
        return { ok: false, error: 'JSON 须包含 manifest 与 source 字段' }
      }
      const result = this.registerPackage(pkg)
      if (!result.ok) return { ok: false, error: result.error }
      return { ok: true }
    } catch {
      return { ok: false, error: '无法解析插件 JSON' }
    }
  }

  unload(pluginId: string): boolean {
    this.deactivate(pluginId)
    return this.plugins.delete(pluginId)
  }
}

export const pluginManager = new PluginManager()

export const createBuiltinPlugins = (): Plugin[] => [
  {
    id: 'format-code',
    name: '代码格式化',
    version: '1.0.0',
    description: '格式化当前文件代码',
    builtin: true,
    activate(context) {
      context.ui.addToolbarButton({
        icon: 'sparkles',
        label: '格式化',
        onClick: () => {
          const content = context.editor.getValue()
          const formatted = content.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n')
          context.editor.setValue(formatted)
          context.ui.showNotification('代码已格式化', 'success')
        },
      })
    },
  },
  {
    id: 'line-count',
    name: '代码统计',
    version: '1.0.0',
    description: '统计代码行数',
    builtin: true,
    activate(context) {
      context.ui.addToolbarButton({
        icon: 'bar-chart',
        label: '统计',
        onClick: () => {
          const files = context.files.getAll()
          let totalLines = 0
          let totalChars = 0
          files.forEach((file) => {
            totalLines += file.content.split('\n').length
            totalChars += file.content.length
          })
          context.ui.showModal(
            '代码统计',
            `文件数: ${files.length}\n总行数: ${totalLines}\n总字符: ${totalChars}`,
          )
        },
      })
    },
  },
]
