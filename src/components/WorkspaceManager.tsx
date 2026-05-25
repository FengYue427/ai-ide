import React, { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Cloud, Download, Folder, FolderOpen, HardDrive, RotateCcw, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { cloudSyncService, type WorkspaceBackup } from '../services/cloudSyncService'
import {
  deleteWorkspaceEntry,
  listWorkspaceEntries,
  loadWorkspaceEntry,
  saveWorkspaceEntry,
  type WorkspaceEntry,
} from '../services/workspaceCatalogService'
import { recentFilesService } from '../services/recentFilesService'
import {
  localProjectEntriesToEditorFiles,
  openLocalProjectIntoWorkspace,
  restoreLocalProjectIntoWorkspace,
} from '../services/localProjectBridge'
import { localProjectService, supportsLocalProject } from '../services/localProjectService'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import type { ConfirmRequest, ToastKind } from './FeedbackCenter'

interface WorkspaceManagerProps {
  currentFiles: { name: string; content: string; language: string }[]
  currentSettings: {
    theme: string
    autoSave: boolean
    language: string
    aiProvider?: string
    aiModel?: string
  }
  notify: (kind: ToastKind, title: string, detail?: string) => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  onLoadWorkspace: (files: WorkspaceBackup['files'], settings: WorkspaceBackup['settings']) => void
  onClose: () => void
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  currentFiles,
  currentSettings,
  notify,
  requestConfirm,
  onLoadWorkspace,
  onClose,
}) => {
  const { t } = useI18n()
  const currentUser = useIDEStore((s) => s.currentUser)
  const isLoggedIn = !!currentUser

  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([])
  const [autoBackup, setAutoBackup] = useState<WorkspaceBackup | null>(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [localDiskName, setLocalDiskName] = useState<string | null>(localProjectService.getRootName())
  const canOpenLocalDisk = supportsLocalProject()

  const loadWorkspaces = async () => {
    setLoading(true)
    try {
      const list = await listWorkspaceEntries(isLoggedIn)
      const backup = await cloudSyncService.getAutoBackup()
      setWorkspaces(list)
      setAutoBackup(backup || null)
    } catch {
      setWorkspaces([])
      setAutoBackup(null)
      setMessage({ type: 'error', text: t('wm.listLoadFailed') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkspaces()
  }, [isLoggedIn])

  const filteredWorkspaces = useMemo(
    () =>
      workspaces.filter(
        (workspace) =>
          workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, workspaces],
  )

  const handleSave = async () => {
    if (!saveName.trim()) return

    const result = await saveWorkspaceEntry(
      saveName,
      currentFiles,
      currentSettings,
      saveDescription,
      isLoggedIn,
    )
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || t('wm.saveFailed') })
      notify('error', t('wm.saveFailed'), result.error)
      return
    }

    setSaveName('')
    setSaveDescription('')
    setShowSaveForm(false)
    const detail = isLoggedIn
      ? t('wm.saved.cloud', { count: currentFiles.length })
      : t('wm.saved.local', { count: currentFiles.length })
    setMessage({ type: 'success', text: t('wm.saved.flash') })
    notify('success', t('wm.saved'), detail)
    const list = await listWorkspaceEntries(isLoggedIn)
    const saved = list.find((workspace) => workspace.name === saveName.trim())
    if (saved) {
      await recentFilesService.addRecentProject({
        id: saved.id,
        name: saved.name,
        fileCount: currentFiles.length,
        workspaceId: saved.id,
      })
      useIDEStore.getState().setRecentProjects(await recentFilesService.getRecentProjects())
    }
    void loadWorkspaces()
  }

  const handleLoad = async (workspace: WorkspaceEntry) => {
    const confirmed = await requestConfirm({
      title: t('wm.confirm.load.title'),
      message: t('wm.confirm.load.message', { name: workspace.name }),
      confirmText: t('wm.confirm.load.confirm'),
    })
    if (!confirmed) return

    const payload = await loadWorkspaceEntry(workspace, isLoggedIn)
    if (!payload) {
      notify('error', t('wm.loadFailed'), t('wm.loadFailedDetail'))
      return
    }

    onLoadWorkspace(payload.files, payload.settings)
    onClose()
  }

  const handleDelete = async (workspace: WorkspaceEntry) => {
    const confirmed = await requestConfirm({
      title: t('wm.confirm.delete.title'),
      message: t('wm.confirm.delete.message', { name: workspace.name }),
      confirmText: t('wm.confirm.delete.confirm'),
      tone: 'danger',
    })
    if (!confirmed) return

    const result = await deleteWorkspaceEntry(workspace, isLoggedIn)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || t('wm.deleteFailed') })
      notify('error', t('wm.deleteFailed'), result.error)
      return
    }

    setMessage({ type: 'success', text: t('wm.deleted.flash') })
    notify('success', t('wm.deleted'), workspace.name)
    void loadWorkspaces()
  }

  const handleExport = async (workspace: WorkspaceEntry) => {
    let exportable = workspace
    if (workspace.source === 'cloud' && workspace.files.length === 0) {
      const full = await loadWorkspaceEntry(workspace, isLoggedIn)
      if (!full) {
        notify('error', t('wm.exportFailed'), t('wm.exportFailedDetail'))
        return
      }
      exportable = { ...workspace, files: full.files, settings: full.settings }
    }

    const json = cloudSyncService.exportWorkspace(exportable)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${workspace.name.replace(/\s+/g, '_')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    notify('success', t('wm.exported'), workspace.name)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const json = (loadEvent.target?.result as string) || ''
      const workspace = await cloudSyncService.importWorkspace(json)
      const nextMessage = workspace
        ? { type: 'success' as const, text: t('wm.importSuccess') }
        : { type: 'error' as const, text: t('wm.importFailed') }
      setMessage(nextMessage)
      notify(nextMessage.type, nextMessage.text, workspace?.name)
      loadWorkspaces()
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleExportAll = async () => {
    const json = await cloudSyncService.exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ide-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    notify('success', t('wm.exportAll'))
  }

  const handleRestoreAutoBackup = async () => {
    const backup = await cloudSyncService.restoreAutoBackup()
    if (!backup) {
      notify('error', t('wm.noAutoBackup'))
      return
    }

    const confirmed = await requestConfirm({
      title: t('wm.confirm.restore.title'),
      message: t('wm.confirm.restore.message'),
      confirmText: t('wm.confirm.restore.confirm'),
    })
    if (!confirmed) return

    onLoadWorkspace(backup.files, backup.settings)
    onClose()
  }

  const handleOpenLocalFolder = async () => {
    setMessage(null)
    try {
      const result = await openLocalProjectIntoWorkspace()
      setLocalDiskName(result.rootName)
      onLoadWorkspace(localProjectEntriesToEditorFiles(result.entries), currentSettings)
      const detail = result.capped
        ? t('wp.local.openDetailCapped', { count: result.imported })
        : t('wp.local.openDetail', { count: result.imported })
      notify('success', t('wp.local.openTitle', { name: result.rootName }), detail)
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'LOCAL_PROJECT_UNSUPPORTED') {
        setMessage({ type: 'error', text: t('wp.local.unsupported') })
      } else if (msg === 'LOCAL_PROJECT_PERMISSION_DENIED') {
        setMessage({ type: 'error', text: t('wp.local.permissionDenied') })
      } else {
        setMessage({ type: 'error', text: t('wp.local.openFailed') })
      }
    }
  }

  const handleRestoreLocalFolder = async () => {
    setMessage(null)
    try {
      const result = await restoreLocalProjectIntoWorkspace()
      if (!result) {
        notify('info', t('wp.local.restoreNone'))
        return
      }
      setLocalDiskName(result.rootName)
      onLoadWorkspace(localProjectEntriesToEditorFiles(result.entries), currentSettings)
      notify('success', t('wp.local.restoreTitle'), t('wp.local.openDetail', { count: result.imported }))
      onClose()
    } catch {
      setMessage({ type: 'error', text: t('wp.local.openFailed') })
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title wm-modal-title">
            <Folder size={18} />
            {t('wm.title')}
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body wm-body">
          <div className="wm-panel wm-panel--hero">
            <div className="wm-hero-title">{t('wm.hero.title')}</div>
            <div className="wm-hero-desc">{isLoggedIn ? t('wm.hero.loggedIn') : t('wm.hero.guest')}</div>
          </div>

          <div className="wm-panel wm-panel--local">
            <div className="wm-hero-title">{t('wm.local.sectionTitle')}</div>
            <div className="wm-hero-desc">
              {canOpenLocalDisk ? t('wm.local.sectionDesc') : t('wp.local.unsupported')}
            </div>
            {canOpenLocalDisk && (
              <>
                <div className="wm-actions" style={{ marginTop: '12px' }}>
                  <button type="button" className="btn btn-primary" onClick={() => void handleOpenLocalFolder()}>
                    <FolderOpen size={16} className="wm-btn-icon-gap" />
                    {t('wp.local.openFolder')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => void handleRestoreLocalFolder()}>
                    <RotateCcw size={16} className="wm-btn-icon-gap" />
                    {t('wp.local.restore')}
                  </button>
                </div>
                {localDiskName && (
                  <div className="status-pill" style={{ marginTop: '10px' }}>
                    <HardDrive size={14} />
                    {t('wp.local.bound', { name: localDiskName })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="wm-panel wm-panel--hero" style={{ opacity: 0.85 }}>
            <div className="wm-hero-title" style={{ fontSize: '13px' }}>{t('wm.cloud.sectionTitle')}</div>
            <div className="wm-hero-desc" style={{ fontSize: '12px' }}>{t('wm.cloud.sectionDesc')}</div>
          </div>

          {message && (
            <div className={`alert-banner wm-flash-row alert-banner--${message.type === 'success' ? 'success' : 'error'}`}>
              <Check size={16} />
              {message.text}
            </div>
          )}

          {autoBackup?.updatedAt && (
            <div className="wm-panel wm-panel--row">
              <div className="wm-backup-info">
                <RotateCcw size={16} color="#3b82f6" />
                <div>
                  <div className="wm-backup-title">{t('wm.autoBackupDetected')}</div>
                  <div className="wm-backup-time">{new Date(autoBackup.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleRestoreAutoBackup}>
                {t('wm.restoreBackup')}
              </button>
            </div>
          )}

          <div className="wm-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowSaveForm((value) => !value)}>
              <Save size={16} className="wm-btn-icon-gap" />
              {t('wm.saveCurrent')}
            </button>
            <label className="btn btn-secondary wm-import-label">
              <Upload size={16} className="wm-btn-icon-gap" />
              {t('wm.importBackup')}
              <input type="file" accept=".json" className="wm-file-input-hidden" onChange={handleImport} />
            </label>
            <button type="button" className="btn btn-secondary" onClick={handleExportAll}>
              <Download size={16} className="wm-btn-icon-gap" />
              {t('wm.exportAllBtn')}
            </button>
          </div>

          {showSaveForm && (
            <div className="wm-panel">
              <div className="wm-form-grid">
                <input
                  type="text"
                  className="wm-input"
                  value={saveName}
                  onChange={(event) => setSaveName(event.target.value)}
                  placeholder={t('wm.namePlaceholder')}
                  autoFocus
                />
                <input
                  type="text"
                  className="wm-input"
                  value={saveDescription}
                  onChange={(event) => setSaveDescription(event.target.value)}
                  placeholder={t('wm.descPlaceholder')}
                />
                <div className="wm-form-actions">
                  <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!saveName.trim()}>
                    {t('common.save')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSaveForm(false)}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="wm-search-wrap">
            <Search size={16} className="wm-search-icon" />
            <input
              type="text"
              className="wm-input wm-search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('wm.searchPlaceholder')}
            />
          </div>

          {loading ? (
            <div className="wm-panel wm-state-panel wm-state-panel--loading">{t('wm.loading')}</div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="wm-panel wm-state-panel wm-state-panel--empty">
              <Folder size={40} className="wm-empty-icon" />
              <div className="wm-empty-title">{t('wm.empty.title')}</div>
              <div className="wm-empty-desc">{t('wm.empty.desc')}</div>
            </div>
          ) : (
            <div className="wm-list">
              {filteredWorkspaces.map((workspace) => (
                <div key={workspace.id} className="wm-panel">
                  <div className="wm-card-grid">
                    <div>
                      <div className="wm-card-title">
                        {workspace.name}
                        <span
                          className={`wm-badge ${workspace.source === 'cloud' ? 'wm-badge--cloud' : 'wm-badge--local'}`}
                        >
                          {workspace.source === 'cloud' ? <Cloud size={12} /> : <HardDrive size={12} />}
                          {workspace.source === 'cloud' ? t('wm.badge.cloud') : t('wm.badge.local')}
                        </span>
                      </div>
                      {workspace.description && <div className="wm-card-desc">{workspace.description}</div>}
                      <div className="wm-card-meta">
                        <span className="wm-card-meta-item">
                          <Clock size={12} />
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </span>
                        <span>
                          {workspace.source === 'cloud' && workspace.files.length === 0
                            ? t('wm.meta.cloudLazy')
                            : t('wm.meta.fileCount', { count: workspace.files.length })}
                        </span>
                        <span className="wm-card-meta-theme">{workspace.settings.theme}</span>
                      </div>
                    </div>
                    <div className="wm-card-actions">
                      <button type="button" className="btn btn-primary" onClick={() => handleLoad(workspace)}>
                        {t('wm.action.load')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleExport(workspace)}
                        title={t('wm.action.exportTitle')}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDelete(workspace)}
                        title={t('wm.action.deleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkspaceManager
