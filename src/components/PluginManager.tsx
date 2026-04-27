import React, { useState, useEffect } from 'react'
import { X, Puzzle, Check, AlertCircle, ExternalLink, Trash2, Plus } from 'lucide-react'
import { pluginManager, createBuiltinPlugins, type Plugin } from '../services/pluginService'

interface PluginManagerProps {
  onClose: () => void
}

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [newPluginUrl, setNewPluginUrl] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // 加载内置插件
    const builtinPlugins = createBuiltinPlugins()
    builtinPlugins.forEach(p => pluginManager.register(p))
    
    setPlugins(pluginManager.getAllPlugins())
    updateActiveIds()
  }, [])

  const updateActiveIds = () => {
    const active = pluginManager.getActivePlugins()
    setActiveIds(new Set(active.map(p => p.id)))
  }

  const togglePlugin = (pluginId: string) => {
    if (activeIds.has(pluginId)) {
      pluginManager.deactivate(pluginId)
      setSuccess(`插件已停用`)
    } else {
      const success = pluginManager.activate(pluginId)
      if (success) {
        setSuccess(`插件已激活`)
      } else {
        setError(`插件激活失败`)
      }
    }
    updateActiveIds()
  }

  const handleAddPlugin = () => {
    if (!newPluginUrl.trim()) return

    setError(null)
    pluginManager.loadPlugin(newPluginUrl).then(success => {
      if (success) {
        setPlugins(pluginManager.getAllPlugins())
        setSuccess('插件加载成功')
        setNewPluginUrl('')
        setShowAddForm(false)
      } else {
        setError('插件加载失败')
      }
    })
  }

  const removePlugin = (pluginId: string) => {
    pluginManager.unload(pluginId)
    setPlugins(pluginManager.getAllPlugins())
    updateActiveIds()
    setSuccess('插件已移除')
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Puzzle size={24} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>插件管理</h3>
          </div>
          <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '0 20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div style={{ margin: '0 20px', padding: '12px', background: 'rgba(35, 197, 94, 0.1)', borderRadius: '6px', color: '#23c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Add Plugin Form */}
        {showAddForm && (
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newPluginUrl}
                onChange={(e) => setNewPluginUrl(e.target.value)}
                placeholder="输入插件 URL 或 npm 包名"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <button onClick={handleAddPlugin} className="btn btn-primary">
                加载
              </button>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              支持: URL (https://...) 或 npm 包名 (npm:package-name)
            </p>
          </div>
        )}

        {/* Plugin List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>已安装插件 ({plugins.length})</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Plus size={14} style={{ marginRight: '4px' }} />
              添加插件
            </button>
          </div>

          {plugins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Puzzle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>暂无已安装插件</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: `1px solid ${activeIds.has(plugin.id) ? 'var(--accent-color)' : 'var(--border-color)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{plugin.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                          v{plugin.version}
                        </span>
                        {activeIds.has(plugin.id) && (
                          <span style={{ fontSize: '11px', color: '#23c55e', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Check size={12} /> 运行中
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {plugin.description}
                      </p>
                      {plugin.author && (
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                          作者: {plugin.author}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => togglePlugin(plugin.id)}
                        className={activeIds.has(plugin.id) ? 'btn btn-secondary' : 'btn btn-primary'}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {activeIds.has(plugin.id) ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => removePlugin(plugin.id)}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <span>插件系统 v1.0 - 实验性功能</span>
          <a
            href="https://github.com/your-repo/ai-ide-plugins"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-color)' }}
          >
            插件文档 <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default PluginManager
