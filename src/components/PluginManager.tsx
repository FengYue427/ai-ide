import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Download, ExternalLink, Plus, Puzzle, Trash2 } from 'lucide-react'
import helloPluginExample from '../../examples/hello.plugin.json'
import {
  installCatalogEntry,
  isPluginInstalled,
  PLUGIN_CATALOG,
  PLUGIN_CATALOG_TAGS,
} from '../services/pluginCatalogService'
import { pluginManager, type Plugin } from '../services/pluginService'
import { loadInstalledPluginPackages, saveInstalledPluginPackages } from '../services/pluginStorage'
import { useI18n, type TranslationKey } from '../i18n'
import { ModalShell } from './ui/ModalShell'

interface PluginManagerProps {
  onClose: () => void
}

type PluginTab = 'installed' | 'market' | 'manual'

function catalogText(id: string, field: 'name' | 'desc', fallback: string, t: (key: TranslationKey) => string) {
  const key = `plugin.catalog.${id}.${field}` as TranslationKey
  const translated = t(key)
  return translated === key ? fallback : translated
}

function catalogTagLabel(tag: string, t: (key: TranslationKey) => string): string {
  const key = `plugin.catalog.tag.${tag}` as TranslationKey
  const translated = t(key)
  return translated === key ? tag : translated
}

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const { t } = useI18n()
  const [tab, setTab] = useState<PluginTab>('installed')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [newPluginJson, setNewPluginJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string>('all')

  const filteredCatalog = useMemo(() => {
    if (tagFilter === 'all') return PLUGIN_CATALOG
    return PLUGIN_CATALOG.filter((entry) => entry.tags.includes(tagFilter))
  }, [tagFilter])

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
      flash('success', t('plugin.disabled'))
    } else {
      const activated = await pluginManager.activate(pluginId)
      flash('success', activated ? t('plugin.enabled') : '')
      if (!activated) flash('error', t('plugin.enableFailed'))
    }
    refreshState()
  }

  const handleAddPlugin = async () => {
    if (!newPluginJson.trim()) return
    setError(null)
    setSuccess(null)
    const result = await pluginManager.loadPlugin(newPluginJson)
    if (!result.ok) {
      flash('error', result.error || t('plugin.loadFailed'))
      return
    }

    try {
      const pkg = JSON.parse(newPluginJson.trim()) as { manifest: { id: string } }
      const packages = await loadInstalledPluginPackages()
      const without = packages.filter((item) => item.manifest.id !== pkg.manifest.id)
      without.push(JSON.parse(newPluginJson.trim()))
      await saveInstalledPluginPackages(without)
    } catch {
      flash('error', t('plugin.storageFailed'))
      return
    }

    refreshState()
    flash('success', t('plugin.installed'))
    setNewPluginJson('')
    setTab('installed')
  }

  const handleInstallCatalog = async (entryId: string) => {
    setError(null)
    setSuccess(null)
    const result = await installCatalogEntry(entryId)
    if (!result.ok) {
      flash('error', result.error || t('plugin.installFailed'))
      return
    }
    refreshState()
    flash('success', t('plugin.flash.marketInstalled'))
    setTab('installed')
  }

  const removePlugin = async (pluginId: string) => {
    pluginManager.unload(pluginId)
    const packages = await loadInstalledPluginPackages()
    await saveInstalledPluginPackages(packages.filter((item) => item.manifest.id !== pluginId))
    refreshState()
    flash('success', t('plugin.removed'))
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
              {plugin.builtin && <span className="status-pill">{t('plugin.builtin')}</span>}
              {isActive && (
                <span className="status-pill" style={{ color: 'var(--success-color)' }}>
                  {t('plugin.running')}
                </span>
              )}
            </div>
            <p className="plugins-card-desc">{plugin.description}</p>
            {plugin.author && (
              <div className="plugins-card-meta">{t('plugin.author', { name: plugin.author })}</div>
            )}
            {plugin.manifest && (
              <div className="plugins-card-meta" style={{ marginTop: 6 }}>
                {t('plugin.permissions', { perms: plugin.manifest.permissions.join(' · ') })}
              </div>
            )}
          </div>
          <div className="plugins-card-actions">
            <button
              type="button"
              className={isActive ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => void togglePlugin(plugin.id)}
            >
              {isActive ? t('plugin.disable') : t('plugin.enable')}
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
      ariaLabel={t('plugin.title')}
      title={
        <span className="modal-title-row">
          <Puzzle size={18} />
          {t('plugin.title')}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <span className="plugins-footer-note">{t('plugin.footer')}</span>
          <a
            href="https://github.com/FengYue427/ai-ide"
            target="_blank"
            rel="noopener noreferrer"
            className="plugins-footer-note"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-color)', textDecoration: 'none' }}
          >
            {t('plugin.repo')}
            <ExternalLink size={13} />
          </a>
        </>
      }
    >
      <div className="plugins-hero">
        <div className="plugins-hero__title">{t('plugin.hero.title')}</div>
        <p className="plugins-hero__desc">{t('plugin.hero.desc')}</p>
        <div className="plugins-hero__meta">
          <span className="status-pill">{t('plugin.count.installed', { count: plugins.length })}</span>
          <span className="status-pill">{t('plugin.count.running', { count: activeCount })}</span>
          <span className="status-pill">{t('plugin.count.market', { count: PLUGIN_CATALOG.length })}</span>
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
          { id: 'installed' as const, label: t('plugin.tab.installed') },
          { id: 'market' as const, label: t('plugin.tab.market') },
          { id: 'manual' as const, label: t('plugin.tab.manual') },
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
              {t('plugin.empty')}
            </div>
          ) : (
            plugins.map(renderPluginCard)
          )}
        </div>
      )}

      {tab === 'market' && (
        <>
          <div className="plugins-tag-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              className={`plugins-tab ${tagFilter === 'all' ? 'plugins-tab--active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setTagFilter('all')}
            >
              {t('plugin.filter.all')}
            </button>
            {PLUGIN_CATALOG_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`plugins-tab ${tagFilter === tag ? 'plugins-tab--active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setTagFilter(tag)}
              >
                {catalogTagLabel(tag, t)}
              </button>
            ))}
          </div>

          <div className="plugins-grid">
          {filteredCatalog.length === 0 ? (
            <div className="plugins-panel plugins-card-desc" style={{ textAlign: 'center' }}>
              {t('plugin.filter.empty')}
            </div>
          ) : null}
          {filteredCatalog.map((entry) => {
            const installed = isPluginInstalled(entry.id, installedIds)
            return (
              <div key={entry.id} className="plugins-panel">
                <div className="plugins-row">
                  <div>
                    <div className="plugins-card-head">
                      <span className="plugins-card-title">
                        {catalogText(entry.id, 'name', entry.name, t)}
                      </span>
                      <span className="plugins-market-badge">{t('plugin.official')}</span>
                      <span className="status-pill">v{entry.version}</span>
                      <span
                        className="status-pill"
                        style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.35)' }}
                        title={t('plugin.rating.title')}
                      >
                        ★ {entry.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="plugins-card-desc">
                      {catalogText(entry.id, 'desc', entry.description, t)}
                    </p>
                    <div className="plugins-card-meta">{t('plugin.author', { name: entry.author })}</div>
                    <div className="plugins-tags">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="plugins-tag">
                          {catalogTagLabel(tag, t)}
                        </span>
                      ))}
                    </div>
                    <div className="plugins-card-meta" style={{ marginTop: 8 }}>
                      {t('plugin.permissions', { perms: entry.permissions.join(' · ') })}
                    </div>
                  </div>
                  <div className="plugins-card-actions">
                    {installed ? (
                      <span className="status-pill" style={{ color: 'var(--success-color)' }}>
                        {t('plugin.badge.installed')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void handleInstallCatalog(entry.id)}
                      >
                        <Download size={14} className="btn-icon-gap" />
                        {t('plugin.install')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}

      {tab === 'manual' && (
        <div className="plugins-panel">
          <p className="plugins-card-desc" style={{ marginBottom: 12 }}>
            {t('plugin.manual.desc')}
          </p>
          <p className="plugins-card-desc" style={{ marginBottom: 12, fontSize: 12, opacity: 0.85 }}>
            {t('plugin.manual.i18nHint')}
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
              {t('plugin.manual.install')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNewPluginJson(JSON.stringify(helloPluginExample, null, 2))}
            >
              {t('plugin.manual.sample')}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default PluginManager
