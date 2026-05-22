import { createTranslator } from '../i18n'
import { getWorkspaceLocale } from './workspaceErrors'
import { ALL_PLUGIN_PERMISSIONS, hasUi, normalizePluginPermissions } from './pluginPermissions'
import {
  createSandboxedContext,
  validateManifest,
  validatePluginSource,
} from './pluginSandbox'
import { runPluginActivateInSandbox, type PluginSandboxHandle } from './pluginSandboxRunner'
import type { PluginContext, PluginManifest } from './pluginTypes'

export type { PluginContext, PluginManifest } from './pluginTypes'

function pt() {
  return createTranslator(getWorkspaceLocale())
}

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
            throw new Error(pt()('plugin.error.noToolbar'))
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

  installPackage(pkg: PluginPackage): { ok: true } | { ok: false; error: string } {
    return this.registerPackage(pkg)
  }

  async loadPlugin(input: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = input.trim()
    const t = pt()
    if (!trimmed) return { ok: false, error: t('plugin.error.emptyJson') }

    if (import.meta.env.PROD) {
      return { ok: false, error: t('plugin.error.prodDisabled') }
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('npm:')) {
      return { ok: false, error: t('plugin.error.remoteDisabled') }
    }

    try {
      const pkg = JSON.parse(trimmed) as PluginPackage
      if (!pkg.manifest || !pkg.source) {
        return { ok: false, error: t('plugin.error.invalidShape') }
      }
      const result = this.registerPackage(pkg)
      if (!result.ok) return { ok: false, error: result.error }
      return { ok: true }
    } catch {
      return { ok: false, error: t('plugin.error.parseFailed') }
    }
  }

  unload(pluginId: string): boolean {
    this.deactivate(pluginId)
    return this.plugins.delete(pluginId)
  }
}

export const pluginManager = new PluginManager()

export const createBuiltinPlugins = (locale = getWorkspaceLocale()): Plugin[] => {
  const t = createTranslator(locale)
  return [
    {
      id: 'format-code',
      name: t('plugin.builtin.format.name'),
      version: '1.0.0',
      description: t('plugin.builtin.format.desc'),
      builtin: true,
      activate(context) {
        context.ui.addToolbarButton({
          icon: 'sparkles',
          label: t('plugin.builtin.format.label'),
          onClick: () => {
            const content = context.editor.getValue()
            const formatted = content.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n')
            context.editor.setValue(formatted)
            context.ui.showNotification(createTranslator(getWorkspaceLocale())('plugin.builtin.format.done'), 'success')
          },
        })
      },
    },
    {
      id: 'line-count',
      name: t('plugin.builtin.stats.name'),
      version: '1.0.0',
      description: t('plugin.builtin.stats.desc'),
      builtin: true,
      activate(context) {
        context.ui.addToolbarButton({
          icon: 'bar-chart',
          label: t('plugin.builtin.stats.label'),
          onClick: () => {
            const files = context.files.getAll()
            let totalLines = 0
            let totalChars = 0
            files.forEach((file) => {
              totalLines += file.content.split('\n').length
              totalChars += file.content.length
            })
            const tr = createTranslator(getWorkspaceLocale())
            context.ui.showModal(
              tr('plugin.builtin.stats.title'),
              tr('plugin.builtin.stats.body', {
                files: files.length,
                lines: totalLines,
                chars: totalChars,
              }),
            )
          },
        })
      },
    },
  ]
}
