import React, { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Cloud, Download, Folder, HardDrive, RotateCcw, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { cloudSyncService, type WorkspaceBackup } from '../services/cloudSyncService'
import {
  deleteWorkspaceEntry,
  listWorkspaceEntries,
  loadWorkspaceEntry,
  saveWorkspaceEntry,
  type WorkspaceEntry,
} from '../services/workspaceCatalogService'
import { recentFilesService } from '../services/recentFilesService'
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

const panelStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '14px',
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  currentFiles,
  currentSettings,
  notify,
  requestConfirm,
  onLoadWorkspace,
  onClose,
}) => {
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
      setMessage({ type: 'error', text: '读取工作区列表失败。' })
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
      setMessage({ type: 'error', text: result.error || '保存失败' })
      notify('error', '保存失败', result.error)
      return
    }

    setSaveName('')
    setSaveDescription('')
    setShowSaveForm(false)
    const detail = isLoggedIn
      ? `${currentFiles.length} 个文件已同步到云端。`
      : `${currentFiles.length} 个文件已写入本地备份。`
    setMessage({ type: 'success', text: '工作区已保存。' })
    notify('success', '工作区已保存', detail)
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
      title: '加载工作区',
      message: `要加载“${workspace.name}”吗？当前未保存的改动可能会丢失。`,
      confirmText: '加载',
    })
    if (!confirmed) return

    const payload = await loadWorkspaceEntry(workspace, isLoggedIn)
    if (!payload) {
      notify('error', '加载失败', '无法读取工作区内容')
      return
    }

    onLoadWorkspace(payload.files, payload.settings)
    onClose()
  }

  const handleDelete = async (workspace: WorkspaceEntry) => {
    const confirmed = await requestConfirm({
      title: '删除工作区',
      message: `确定删除“${workspace.name}”吗？这个备份删除后无法从列表恢复。`,
      confirmText: '删除',
      tone: 'danger',
    })
    if (!confirmed) return

    const result = await deleteWorkspaceEntry(workspace, isLoggedIn)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || '删除失败' })
      notify('error', '删除失败', result.error)
      return
    }

    setMessage({ type: 'success', text: '工作区已删除。' })
    notify('success', '工作区已删除', workspace.name)
    void loadWorkspaces()
  }

  const handleExport = async (workspace: WorkspaceEntry) => {
    let exportable = workspace
    if (workspace.source === 'cloud' && workspace.files.length === 0) {
      const full = await loadWorkspaceEntry(workspace, isLoggedIn)
      if (!full) {
        notify('error', '导出失败', '无法读取云端工作区')
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
    notify('success', '工作区已导出', workspace.name)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const json = (loadEvent.target?.result as string) || ''
      const workspace = await cloudSyncService.importWorkspace(json)
      const nextMessage = workspace
        ? { type: 'success' as const, text: '工作区导入成功。' }
        : { type: 'error' as const, text: '导入失败，请检查文件格式。' }
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
    notify('success', '全部数据已导出')
  }

  const handleRestoreAutoBackup = async () => {
    const backup = await cloudSyncService.restoreAutoBackup()
    if (!backup) {
      notify('error', '没有找到自动备份')
      return
    }

    const confirmed = await requestConfirm({
      title: '恢复自动备份',
      message: '找到一份自动备份。恢复后会替换当前编辑器中的文件和部分设置。',
      confirmText: '恢复',
    })
    if (!confirmed) return

    onLoadWorkspace(backup.files, backup.settings)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '920px', maxWidth: '96vw', maxHeight: '88vh' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={18} />
            工作区管理
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: '16px', overflowY: 'auto' }}>
          <div style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(59,130,246,0.10), transparent 72%)' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>保存阶段成果，也给恢复留后路</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {isLoggedIn
                ? '已登录：保存会同步到云端（并保留本地副本）。列表中带「云端」标记的条目来自服务器。'
                : '这里可以保存当前工作区、导入旧备份、导出全部数据，或从自动备份恢复到之前的状态。'}
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: message.type === 'success' ? 'rgba(51,197,142,0.10)' : 'rgba(248,81,73,0.10)',
                color: message.type === 'success' ? '#33c58e' : '#ff7b72',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Check size={16} />
              {message.text}
            </div>
          )}

          {autoBackup?.updatedAt && (
            <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RotateCcw size={16} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>检测到自动备份</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(autoBackup.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleRestoreAutoBackup}>
                恢复备份
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowSaveForm((value) => !value)}>
              <Save size={16} style={{ marginRight: '6px' }} />
              保存当前工作区
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} style={{ marginRight: '6px' }} />
              导入备份
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-secondary" onClick={handleExportAll}>
              <Download size={16} style={{ marginRight: '6px' }} />
              导出全部数据
            </button>
          </div>

          {showSaveForm && (
            <div style={panelStyle}>
              <div style={{ display: 'grid', gap: '10px' }}>
                <input
                  type="text"
                  value={saveName}
                  onChange={(event) => setSaveName(event.target.value)}
                  placeholder="工作区名称"
                  autoFocus
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={saveDescription}
                  onChange={(event) => setSaveDescription(event.target.value)}
                  placeholder="描述（可选）"
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={!saveName.trim()}>
                    保存
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowSaveForm(false)}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索工作区"
              style={{
                ...inputStyle,
                width: '100%',
                paddingLeft: '38px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {loading ? (
            <div style={{ ...panelStyle, textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
              正在加载工作区列表…
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div style={{ ...panelStyle, textAlign: 'center', color: 'var(--text-secondary)', padding: '48px 24px' }}>
              <Folder size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>还没有保存过工作区</div>
              <div style={{ fontSize: '13px' }}>先把当前进度存下来，之后就能随时回到这里。</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredWorkspaces.map((workspace) => (
                <div key={workspace.id} style={panelStyle}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{workspace.name}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            verticalAlign: 'middle',
                            background:
                              workspace.source === 'cloud'
                                ? 'color-mix(in srgb, #3b82f6 18%, transparent)'
                                : 'var(--bg-tertiary)',
                            color: workspace.source === 'cloud' ? '#60a5fa' : 'var(--text-secondary)',
                          }}
                        >
                          {workspace.source === 'cloud' ? <Cloud size={12} /> : <HardDrive size={12} />}
                          {workspace.source === 'cloud' ? '云端' : '本地'}
                        </span>
                      </div>
                      {workspace.description && (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                          {workspace.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </span>
                        <span>
                          {workspace.source === 'cloud' && workspace.files.length === 0
                            ? '云端（加载时拉取）'
                            : `${workspace.files.length} 个文件`}
                        </span>
                        <span style={{ textTransform: 'uppercase' }}>{workspace.settings.theme}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => handleLoad(workspace)}>
                        加载
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleExport(workspace)} title="导出工作区">
                        <Download size={14} />
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDelete(workspace)} title="删除工作区">
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
