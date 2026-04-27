// 插件系统核心架构
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
    showModal: (title: string, content: React.ReactNode) => void
    addToolbarButton: (config: { icon: string; label: string; onClick: () => void }) => void
  }
}

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author?: string
  icon?: string
  activate: (context: PluginContext) => void
  deactivate?: () => void
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author?: string
  icon?: string
  entry: string // 插件入口文件路径
  permissions: Array<'editor' | 'files' | 'terminal' | 'ai' | 'ui'>
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private activePlugins: Map<string, Plugin> = new Map()
  private context: PluginContext | null = null

  setContext(context: PluginContext) {
    this.context = context
  }

  // 注册插件
  register(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`)
      return false
    }
    this.plugins.set(plugin.id, plugin)
    console.log(`Plugin registered: ${plugin.name} v${plugin.version}`)
    return true
  }

  // 激活插件
  activate(pluginId: string): boolean {
    if (!this.context) {
      console.error('Plugin context not set')
      return false
    }

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`)
      return false
    }

    if (this.activePlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} already active`)
      return false
    }

    try {
      plugin.activate(this.context)
      this.activePlugins.set(pluginId, plugin)
      console.log(`Plugin activated: ${plugin.name}`)
      return true
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error)
      return false
    }
  }

  // 停用插件
  deactivate(pluginId: string): boolean {
    const plugin = this.activePlugins.get(pluginId)
    if (!plugin) return false

    try {
      plugin.deactivate?.()
      this.activePlugins.delete(pluginId)
      console.log(`Plugin deactivated: ${plugin.name}`)
      return true
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error)
      return false
    }
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取激活的插件
  getActivePlugins(): Plugin[] {
    return Array.from(this.activePlugins.values())
  }

  // 检查插件是否激活
  isActive(pluginId: string): boolean {
    return this.activePlugins.has(pluginId)
  }

  // 加载插件（从 URL 或本地存储）
  async loadPlugin(url: string): Promise<boolean> {
    try {
      // 在实际实现中，这里会动态导入插件代码
      console.log(`Loading plugin from: ${url}`)
      // const module = await import(/* @vite-ignore */ url)
      // this.register(module.default)
      return true
    } catch (error) {
      console.error('Failed to load plugin:', error)
      return false
    }
  }

  // 卸载插件
  unload(pluginId: string): boolean {
    this.deactivate(pluginId)
    return this.plugins.delete(pluginId)
  }
}

export const pluginManager = new PluginManager()

// 内置插件示例
export const createBuiltinPlugins = (): Plugin[] => [
  {
    id: 'format-code',
    name: '代码格式化',
    version: '1.0.0',
    description: '格式化当前文件代码',
    activate(context) {
      context.ui.addToolbarButton({
        icon: 'sparkles',
        label: '格式化',
        onClick: () => {
          const content = context.editor.getValue()
          // 简单的格式化逻辑
          const formatted = content
            .replace(/\s+$/gm, '') // 去除行尾空格
            .replace(/\n{3,}/g, '\n\n') // 多个空行合并
          context.editor.setValue(formatted)
          context.ui.showNotification('代码已格式化', 'success')
        }
      })
    }
  },
  {
    id: 'line-count',
    name: '代码统计',
    version: '1.0.0',
    description: '统计代码行数',
    activate(context) {
      context.ui.addToolbarButton({
        icon: 'bar-chart',
        label: '统计',
        onClick: () => {
          const files = context.files.getAll()
          let totalLines = 0
          let totalChars = 0
          files.forEach(f => {
            totalLines += f.content.split('\n').length
            totalChars += f.content.length
          })
          context.ui.showModal('代码统计', 
            `文件数: ${files.length}\n总行数: ${totalLines}\n总字符: ${totalChars}`
          )
        }
      })
    }
  }
]
