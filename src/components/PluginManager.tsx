import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, ExternalLink, Plus, Puzzle, Trash2, X } from 'lucide-react'
import helloPluginExample from '../../examples/hello.plugin.json'
import { pluginManager, type Plugin } from '../services/pluginService'
import { loadInstalledPluginPackages, saveInstalledPluginPackages } from '../services/pluginStorage'

interface PluginManagerProps {
  onClose: () => void
}

const panelStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
}

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [newPluginJson, setNewPluginJson] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refreshState = () => {
    setPlugins(pluginManager.getAllPlugins())
    setActiveIds(new Set(pluginManager.getActivePlugins().map((plugin) => plugin.id)))
  }

  useEffect(() => {
    refreshState()
  }, [])

  const activeCount = useMemo(() => plugins.filter((plugin) => activeIds.has(plugin.id)).length, [plugins, activeIds])

  const togglePlugin = (pluginId: string) => {
    setError(null)
    setSuccess(null)

    if (activeIds.has(pluginId)) {
      pluginManager.deactivate(pluginId)
      setSuccess('插件已停用。')
    } else {
      const activated = pluginManager.activate(pluginId)
      if (activated) {
        setSuccess('插件已启用。')
      } else {
        setError('插件启用失败，请检查插件兼容性。')
      }
    }

    refreshState()
  }

  const handleAddPlugin = async () => {
    if (!newPluginJson.trim()) return

    setError(null)
    setSuccess(null)
    const result = await pluginManager.loadPlugin(newPluginJson)
    if (!result.ok) {
      setError(result.error || '插件加载失败')
      return
    }

    try {
      const pkg = JSON.parse(newPluginJson.trim()) as { manifest: { id: string } }
      const packages = await loadInstalledPluginPackages()
      const without = packages.filter((item) => item.manifest.id !== pkg.manifest.id)
      without.push(JSON.parse(newPluginJson.trim()))
      await saveInstalledPluginPackages(without)
    } catch {
      setError('插件已加载但未能写入本地存储')
    }

    refreshState()
    setSuccess('插件已安装并通过沙箱校验。')
    setNewPluginJson('')
    setShowAddForm(false)
  }

  const removePlugin = async (pluginId: string) => {
    pluginManager.unload(pluginId)
    const packages = await loadInstalledPluginPackages()
    await saveInstalledPluginPackages(packages.filter((item) => item.manifest.id !== pluginId))
    refreshState()
    setSuccess('插件已移除。')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '860px', maxWidth: '96vw', maxHeight: '88vh' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Puzzle size={18} />
            插件管理
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: '16px', overflowY: 'auto' }}>
          <div
            style={{
              ...panelStyle,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.10), transparent 70%)',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>把 IDE 变成更贴合你工作方式的工具</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              这里可以启用内置插件、加载外部扩展，并快速查看当前运行状态。适合把高频能力按自己的习惯拼起来。
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <span className="status-pill">{plugins.length} 个插件</span>
              <span className="status-pill">{activeCount} 个启用中</span>
            </div>
          </div>

          {(error || success) && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: error ? 'rgba(248,81,73,0.10)' : 'rgba(51,197,142,0.10)',
                color: error ? '#ff7b72' : '#33c58e',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {error ? <AlertCircle size={16} /> : <Check size={16} />}
              {error || success}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>已安装插件</div>
            <button className="btn btn-secondary" onClick={() => setShowAddForm((value) => !value)}>
              <Plus size={14} style={{ marginRight: '6px' }} />
              {showAddForm ? '收起加载入口' : '加载新插件'}
            </button>
          </div>

          {showAddForm && (
            <div style={panelStyle}>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  粘贴插件 JSON（manifest.permissions + source 中的 activate）。安装前会做沙箱校验。
                </div>
                <textarea
                  value={newPluginJson}
                  onChange={(event) => setNewPluginJson(event.target.value)}
                  placeholder='{"manifest":{...},"source":"function activate(context){...}"}'
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, monospace',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={() => void handleAddPlugin()}>
                    安装插件
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setNewPluginJson(JSON.stringify(helloPluginExample, null, 2))}
                  >
                    加载示例
                  </button>
                </div>
              </div>
            </div>
          )}

          {plugins.length === 0 ? (
            <div style={{ ...panelStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
              还没有可用插件。
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {plugins.map((plugin) => {
                const isActive = activeIds.has(plugin.id)
                return (
                  <div
                    key={plugin.id}
                    style={{
                      ...panelStyle,
                      borderColor: isActive ? 'color-mix(in srgb, var(--accent-color) 34%, var(--border-color))' : 'var(--border-color)',
                      background: isActive ? 'linear-gradient(135deg, rgba(124,156,255,0.08), transparent 82%)' : 'var(--bg-primary)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700 }}>{plugin.name}</span>
                          <span className="status-pill">v{plugin.version}</span>
                          {isActive && <span className="status-pill" style={{ color: '#33c58e' }}>运行中</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                          {plugin.description}
                        </div>
                        {plugin.author && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>作者：{plugin.author}</div>
                        )}
                        {plugin.manifest && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            权限：{plugin.manifest.permissions.join(' · ')}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button className={isActive ? 'btn btn-secondary' : 'btn btn-primary'} onClick={() => togglePlugin(plugin.id)}>
                          {isActive ? '停用' : '启用'}
                        </button>
                        {!plugin.builtin && (
                          <button type="button" className="btn btn-secondary" onClick={() => void removePlugin(plugin.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>插件系统 v1.0 · 实验功能</span>
          <a
            href="https://github.com/your-repo/ai-ide-plugins"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontSize: '13px', textDecoration: 'none' }}
          >
            插件文档
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default PluginManager
