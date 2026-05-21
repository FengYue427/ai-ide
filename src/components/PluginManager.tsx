import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Download, ExternalLink, Plus, Puzzle, Trash2 } from 'lucide-react'
import helloPluginExample from '../../examples/hello.plugin.json'
import {
  installCatalogEntry,
  isPluginInstalled,
  PLUGIN_CATALOG,
} from '../services/pluginCatalogService'
import { pluginManager, type Plugin } from '../services/pluginService'
import { loadInstalledPluginPackages, saveInstalledPluginPackages } from '../services/pluginStorage'
import { ModalShell } from './ui/ModalShell'

interface PluginManagerProps {
  onClose: () => void
}

type PluginTab = 'installed' | 'market' | 'manual'

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [tab, setTab] = useState<PluginTab>('installed')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [newPluginJson, setNewPluginJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refreshState = () => {
    setPlugins(pluginManager.getAllPlugins())
    setActiveIds(new Set(pluginManager.getActivePlugins().map((plugin) => plugin.id)))
  }

  useEffect(() => {
    refreshState()
  }, [])

  const installedIds = useMemo(() => plugins.map((plugin) => plugin.id), [plugins])
  const activeCount = useMemo(() => plugins.filter((plugin) => activeIds.has(plugin.id)).length, [plugins, activeIds])

  const flash = (type: 'error' | 'success', text: string) => {
    setError(type === 'error' ? text : null)
    setSuccess(type === 'success' ? text : null)
  }

  const togglePlugin = async (pluginId: string) => {
    flash('success', '')
    setError(null)

    if (activeIds.has(pluginId)) {
      pluginManager.deactivate(pluginId)
      flash('success', '插件已停用。')
    } else {
      const activated = await pluginManager.activate(pluginId)
      flash('success', activated ? '插件已启用。' : '')
      if (!activated) flash('error', '插件启用失败，请检查权限与兼容性。')
    }
    refreshState()
  }

  const handleAddPlugin = async () => {
    if (!newPluginJson.trim()) return
    setError(null)
    setSuccess(null)
    const result = await pluginManager.loadPlugin(newPluginJson)
    if (!result.ok) {
      flash('error', result.error || '插件加载失败')
      return
    }

    try {
      const pkg = JSON.parse(newPluginJson.trim()) as { manifest: { id: string } }
      const packages = await loadInstalledPluginPackages()
      const without = packages.filter((item) => item.manifest.id !== pkg.manifest.id)
      without.push(JSON.parse(newPluginJson.trim()))
      await saveInstalledPluginPackages(without)
    } catch {
      flash('error', '插件已加载但未能写入本地存储')
      return
    }

    refreshState()
    flash('success', '插件已安装并通过沙箱校验。')
    setNewPluginJson('')
    setTab('installed')
  }

  const handleInstallCatalog = async (entryId: string) => {
    setError(null)
    setSuccess(null)
    const result = await installCatalogEntry(entryId)
    if (!result.ok) {
      flash('error', result.error || '安装失败')
      return
    }
    refreshState()
    flash('success', '已从插件市场安装，可在「已安装」中启用。')
    setTab('installed')
  }

  const removePlugin = async (pluginId: string) => {
    pluginManager.unload(pluginId)
    const packages = await loadInstalledPluginPackages()
    await saveInstalledPluginPackages(packages.filter((item) => item.manifest.id !== pluginId))
    refreshState()
    flash('success', '插件已移除。')
  }

  const renderPluginCard = (plugin: Plugin) => {
    const isActive = activeIds.has(plugin.id)
    return (
      <div key={plugin.id} className={`plugins-panel ${isActive ? 'plugins-panel--active' : ''}`}>
        <div className="plugins-row">
          <div>
            <div className="plugins-card-head">
              <span className="plugins-card-title">{plugin.name}</span>
              <span className="status-pill">v{plugin.version}</span>
              {plugin.builtin && <span className="status-pill">内置</span>}
              {isActive && <span className="status-pill" style={{ color: 'var(--success-color)' }}>运行中</span>}
            </div>
            <p className="plugins-card-desc">{plugin.description}</p>
            {plugin.author && <div className="plugins-card-meta">作者：{plugin.author}</div>}
            {plugin.manifest && (
              <div className="plugins-card-meta" style={{ marginTop: 6 }}>
                权限：{plugin.manifest.permissions.join(' · ')}
              </div>
            )}
          </div>
          <div className="plugins-card-actions">
            <button
              type="button"
              className={isActive ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => void togglePlugin(plugin.id)}
            >
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
  }

  return (
    <ModalShell
      className="modal--plugins"
      bodyClassName="modal-body--stack"
      ariaLabel="插件管理"
      title={
        <span className="modal-title-row">
          <Puzzle size={18} />
          插件管理
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <span className="plugins-footer-note">插件系统 v1.1 · 沙箱 + 官方目录</span>
          <a
            href="https://github.com/FengYue427/ai-ide"
            target="_blank"
            rel="noopener noreferrer"
            className="plugins-footer-note"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-color)', textDecoration: 'none' }}
          >
            仓库说明
            <ExternalLink size={13} />
          </a>
        </>
      }
    >
      <div className="plugins-hero">
        <div className="plugins-hero__title">把 IDE 拼成更贴合你工作方式的工具</div>
        <p className="plugins-hero__desc">
          内置插件、官方市场目录与手动 JSON 安装。第三方插件在 Worker 沙箱中运行，并受权限令牌约束。
        </p>
        <div className="plugins-hero__meta">
          <span className="status-pill">{plugins.length} 个已安装</span>
          <span className="status-pill">{activeCount} 个运行中</span>
          <span className="status-pill">{PLUGIN_CATALOG.length} 个市场条目</span>
        </div>
      </div>

      {(error || success) && (
        <div className={`alert-banner wm-flash-row alert-banner--${error ? 'error' : 'success'}`}>
          {error ? <AlertCircle size={16} /> : <Check size={16} />}
          {error || success}
        </div>
      )}

      <div className="plugins-tabs">
        {[
          { id: 'installed' as const, label: '已安装' },
          { id: 'market' as const, label: '插件市场' },
          { id: 'manual' as const, label: '手动安装' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`plugins-tab ${tab === item.id ? 'plugins-tab--active' : ''}`}
            onClick={() => {
              setTab(item.id)
              setError(null)
              setSuccess(null)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'installed' && (
        <div className="plugins-grid">
          {plugins.length === 0 ? (
            <div className="plugins-panel plugins-card-desc" style={{ textAlign: 'center' }}>
              还没有插件。打开「插件市场」安装官方示例。
            </div>
          ) : (
            plugins.map(renderPluginCard)
          )}
        </div>
      )}

      {tab === 'market' && (
        <div className="plugins-grid">
          {PLUGIN_CATALOG.map((entry) => {
            const installed = isPluginInstalled(entry.id, installedIds)
            return (
              <div key={entry.id} className="plugins-panel">
                <div className="plugins-row">
                  <div>
                    <div className="plugins-card-head">
                      <span className="plugins-card-title">{entry.name}</span>
                      <span className="plugins-market-badge">官方</span>
                      <span className="status-pill">v{entry.version}</span>
                    </div>
                    <p className="plugins-card-desc">{entry.description}</p>
                    <div className="plugins-card-meta">作者：{entry.author}</div>
                    <div className="plugins-tags">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="plugins-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="plugins-card-meta" style={{ marginTop: 8 }}>
                      权限：{entry.permissions.join(' · ')}
                    </div>
                  </div>
                  <div className="plugins-card-actions">
                    {installed ? (
                      <span className="status-pill" style={{ color: 'var(--success-color)' }}>
                        已安装
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void handleInstallCatalog(entry.id)}
                      >
                        <Download size={14} className="btn-icon-gap" />
                        安装
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'manual' && (
        <div className="plugins-panel">
          <p className="plugins-card-desc" style={{ marginBottom: 12 }}>
            粘贴插件 JSON（manifest + source）。开发环境可安装任意通过校验的包；生产环境默认禁用手动第三方 JSON。
          </p>
          <textarea
            className="plugins-code"
            value={newPluginJson}
            onChange={(event) => setNewPluginJson(event.target.value)}
            placeholder='{"manifest":{...},"source":"function activate(context){...}"}'
            rows={10}
          />
          <div className="plugins-actions-row">
            <button type="button" className="btn btn-primary" onClick={() => void handleAddPlugin()}>
              <Plus size={14} className="btn-icon-gap" />
              安装插件
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNewPluginJson(JSON.stringify(helloPluginExample, null, 2))}
            >
              加载示例 JSON
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default PluginManager
