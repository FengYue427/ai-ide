import React, { useState, useEffect } from 'react'
import { X, Plus, Download, Upload, Trash2, Clock, Save, Folder, Search, RotateCcw, Check } from 'lucide-react'
import { cloudSyncService, type WorkspaceBackup } from '../services/cloudSyncService'

interface WorkspaceManagerProps {
  currentFiles: { name: string; content: string; language: string }[]
  currentSettings: {
    theme: string
    autoSave: boolean
    language: string
    aiProvider?: string
    aiModel?: string
  }
  onLoadWorkspace: (files: WorkspaceBackup['files'], settings: WorkspaceBackup['settings']) => void
  onClose: () => void
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  currentFiles,
  currentSettings,
  onLoadWorkspace,
  onClose
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceBackup[]>([])
  const [autoBackup, setAutoBackup] = useState<WorkspaceBackup | null>(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      const list = await cloudSyncService.getAllWorkspaces()
      setWorkspaces(list || [])
      const backup = await cloudSyncService.getAutoBackup()
      setAutoBackup(backup || null)
    } catch (error) {
      console.error('Failed to load workspaces:', error)
      setWorkspaces([])
      setAutoBackup(null)
    }
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    
    await cloudSyncService.saveWorkspace(
      saveName,
      currentFiles,
      currentSettings,
      saveDescription
    )
    
    setSaveName('')
    setSaveDescription('')
    setShowSaveForm(false)
    loadWorkspaces()
  }

  const handleLoad = (workspace: WorkspaceBackup) => {
    if (confirm(`确定要加载工作区 "${workspace.name}" 吗？当前未保存的更改将丢失。`)) {
      onLoadWorkspace(workspace.files, workspace.settings)
      onClose()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个工作区吗？')) {
      await cloudSyncService.deleteWorkspace(id)
      loadWorkspaces()
    }
  }

  const handleExport = (workspace: WorkspaceBackup) => {
    const json = cloudSyncService.exportWorkspace(workspace)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workspace.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const json = event.target?.result as string
      const workspace = await cloudSyncService.importWorkspace(json)
      if (workspace) {
        loadWorkspaces()
        alert('工作区导入成功！')
      } else {
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportAll = async () => {
    const json = await cloudSyncService.exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ide_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestoreAutoBackup = async () => {
    const backup = await cloudSyncService.restoreAutoBackup()
    if (backup) {
      if (confirm('找到自动备份，确定要恢复吗？')) {
        onLoadWorkspace(backup.files, backup.settings)
        onClose()
      }
    } else {
      alert('没有找到自动备份')
    }
  }

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          maxWidth: '700px',
          maxHeight: '85vh',
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
            <Folder size={24} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>工作区管理</h3>
          </div>
          <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Auto Backup Alert */}
        {autoBackup && autoBackup.updatedAt && (
          <div
            style={{
              padding: '12px 20px',
              background: '#3b82f610',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '14px' }}>
                发现自动备份（{new Date(autoBackup.updatedAt).toLocaleString()}）
              </span>
            </div>
            <button
              onClick={handleRestoreAutoBackup}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              恢复
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowSaveForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={16} />
            保存当前工作区
          </button>
          <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Upload size={16} />
            导入
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button
            onClick={handleExportAll}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            导出全部
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工作区..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Save Form */}
        {showSaveForm && (
          <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="工作区名称"
                autoFocus
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="描述（可选）"
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSave} className="btn btn-primary" disabled={!saveName.trim()}>
                  保存
                </button>
                <button onClick={() => setShowSaveForm(false)} className="btn btn-secondary">
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {filteredWorkspaces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Folder size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>暂无保存的工作区</p>
              <p style={{ fontSize: '13px' }}>点击上方按钮保存当前工作区</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{workspace.name}</h4>
                      {workspace.description && (
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {workspace.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </span>
                        <span>{workspace.files.length} 个文件</span>
                        <span style={{ textTransform: 'uppercase' }}>{workspace.settings.theme}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleLoad(workspace)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleExport(workspace)}
                        style={{ padding: '6px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="导出"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(workspace.id)}
                        style={{ padding: '6px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                        title="删除"
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
