import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  FileCode,
  FileJson,
  FileText,
  FileType,
  Folder,
  FolderOpen,
  HardDrive,
  RefreshCw,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { workspaceContextService, type WorkspaceFile } from '../services/workspaceContextService'
import { useI18n } from '../i18n'
import type { ConfirmRequest, ToastKind } from './FeedbackCenter'

interface WorkspacePanelProps {
  onClose: () => void
  onFilesChange?: (files: { name: string; content: string; language: string }[]) => void
  currentFiles?: { name: string; content: string; language: string }[]
  notify: (kind: ToastKind, title: string, detail?: string) => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
}

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
  file?: WorkspaceFile
}

const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  onClose,
  onFilesChange,
  currentFiles,
  notify,
  requestConfirm,
}) => {
  const { t } = useI18n()
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [stats, setStats] = useState(workspaceContextService.getStats())
  const [dragActive, setDragActive] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const hasSyncedFiles = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshFiles = useCallback(() => {
    const allFiles = workspaceContextService.getAllFiles()
    setFiles(allFiles)
    setStats(workspaceContextService.getStats())

    if (onFilesChange) {
      onFilesChange(allFiles.map((file) => ({
        name: file.name,
        content: file.content,
        language: file.language,
      })))
    }
  }, [onFilesChange])

  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  useEffect(() => {
    if (!currentFiles?.length || hasSyncedFiles.current) return

    const workspaceFiles = workspaceContextService.getAllFiles()
    if (workspaceFiles.length === 0) {
      workspaceContextService.createFromFiles(currentFiles, t('wp.defaultProjectName'))
      hasSyncedFiles.current = true
      refreshFiles()
    }
  }, [currentFiles, refreshFiles])

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(event.type === 'dragenter' || event.type === 'dragover')
  }, [])

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    setError(null)

    const items = event.dataTransfer.items
    if (!items) return

    setIsImporting(true)
    let totalFiles = 0
    let processedFiles = 0

    try {
      for (let index = 0; index < items.length; index++) {
        const entry = items[index].webkitGetAsEntry()
        if (entry?.isFile) totalFiles++
        if (entry?.isDirectory) totalFiles += 10
      }

      setImportProgress({ current: 0, total: totalFiles })

      for (let index = 0; index < items.length; index++) {
        const entry = items[index].webkitGetAsEntry()
        if (!entry) continue

        if (entry.isFile) {
          await new Promise<void>((resolve, reject) => {
            ;(entry as FileSystemFileEntry).file(async (file) => {
              try {
                await workspaceContextService.addFileFromLocal(file)
                processedFiles++
                setImportProgress({ current: processedFiles, total: totalFiles })
                resolve()
              } catch (error) {
                reject(error)
              }
            }, reject)
          })
        } else if (entry.isDirectory) {
          const result = await workspaceContextService.addFilesFromDirectory(entry as FileSystemDirectoryEntry)
          processedFiles += result.success
          setImportProgress({ current: processedFiles, total: totalFiles })
          if (result.errors.length > 0) {
            notify(
              'info',
              t('wp.notify.partialImport'),
              t('wp.notify.partialImportDetail', { errors: result.errors.join('; ') }),
            )
          }
        }
      }

      refreshFiles()
      notify('success', t('wp.notify.imported'), t('wp.notify.importedDetail', { count: processedFiles }))
    } catch (error) {
      setError(error instanceof Error ? error.message : t('wp.notify.importFailed'))
    } finally {
      setIsImporting(false)
      setImportProgress({ current: 0, total: 0 })
    }
  }, [notify, refreshFiles, t])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    setIsImporting(true)
    setError(null)

    try {
      const result = await workspaceContextService.addFilesFromLocal(Array.from(selectedFiles))
      if (result.failed > 0 && result.errors.length > 0) {
        notify(
          'info',
          t('wp.notify.partialImport'),
          t('wp.notify.partialImportDetail', { errors: result.errors.join('; ') }),
        )
      }
      refreshFiles()
      notify(
        result.failed > 0 ? 'info' : 'success',
        t('wp.notify.importDone'),
        t('wp.notify.importDoneDetail', { success: result.success, failed: result.failed }),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : t('wp.notify.importFailed'))
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }, [notify, refreshFiles, t])

  const handleRemoveFile = useCallback((path: string) => {
    workspaceContextService.removeFile(path)
    refreshFiles()
    notify('success', t('wp.notify.removed'), path)
  }, [notify, refreshFiles, t])

  const handleToggleSelect = useCallback((path: string) => {
    workspaceContextService.toggleFileSelection(path)
    refreshFiles()
  }, [refreshFiles])

  const handleSelectAll = useCallback((selected: boolean) => {
    workspaceContextService.selectAllFiles(selected)
    refreshFiles()
    notify('success', selected ? t('wp.notify.selectAll') : t('wp.notify.deselectAll'))
  }, [notify, refreshFiles, t])

  const handleClear = useCallback(async () => {
    const confirmed = await requestConfirm({
      title: t('wp.confirm.clear.title'),
      message: t('wp.confirm.clear.message'),
      confirmText: t('wp.confirm.clear.confirm'),
      tone: 'danger',
    })
    if (!confirmed) return

    workspaceContextService.clearContext()
    refreshFiles()
    notify('success', t('wp.notify.cleared'))
  }, [notify, refreshFiles, requestConfirm, t])

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const fileTree = useMemo(() => {
    const root: FileTreeNode[] = []

    files.forEach((file) => {
      const parts = file.path.split('/').filter(Boolean)
      let currentLevel = root
      let currentPath = ''

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isLast = index === parts.length - 1
        const existingNode = currentLevel.find((node) => node.name === part)

        if (existingNode) {
          if (!isLast) currentLevel = existingNode.children!
          return
        }

        const newNode: FileTreeNode = isLast
          ? { name: part, path: currentPath, type: 'file', file }
          : { name: part, path: currentPath, type: 'folder', children: [] }
        currentLevel.push(newNode)
        if (!isLast) currentLevel = newNode.children!
      })
    })

    return root
  }, [files])

  const getFileIcon = (language: string) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <FileCode size={16} style={{ color: '#facc15' }} />
      case 'json':
        return <FileJson size={16} style={{ color: '#9ca3af' }} />
      case 'html':
        return <FileType size={16} style={{ color: '#f97316' }} />
      case 'css':
      case 'scss':
      case 'sass':
        return <FileType size={16} style={{ color: '#38bdf8' }} />
      case 'markdown':
        return <FileText size={16} style={{ color: '#9ca3af' }} />
      default:
        return <FileIcon size={16} style={{ color: 'var(--text-secondary)' }} />
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const renderTreeNode = (node: FileTreeNode, depth = 0): React.ReactNode => {
    const paddingLeft = 12 + depth * 16

    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path)
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleFolder(node.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', paddingLeft, cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--border-color)' }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={16} style={{ color: '#fbbf24' }} />
            <span style={{ flex: 1 }}>{node.name}</span>
          </div>
          {isExpanded && node.children?.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      )
    }

    const file = node.file!
    return (
      <div
        key={node.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          paddingLeft,
          borderBottom: '1px solid var(--border-color)',
          background: file.selected !== false ? 'rgba(124, 156, 255, 0.10)' : 'transparent',
        }}
      >
        <button onClick={() => handleToggleSelect(file.path)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }} title={t('wp.toggleSelect')}>
          {file.selected !== false ? <CheckSquare size={16} style={{ color: 'var(--accent-color)' }} /> : <Square size={16} />}
        </button>
        {getFileIcon(file.language)}
        <span style={{ flex: 1, minWidth: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatSize(file.size)}</span>
        <button onClick={() => handleRemoveFile(file.path)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }} title={t('wp.removeFromContext')}>
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '680px', maxWidth: '94vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} />
            {t('wp.title')}
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {[
              { icon: <HardDrive size={14} />, label: t('wp.stat.files'), value: stats.totalFiles },
              { icon: <CheckSquare size={14} />, label: t('wp.stat.selected'), value: stats.selectedFiles },
              { icon: <FileText size={14} />, label: t('wp.stat.size'), value: formatSize(stats.totalSize) },
              { icon: <RefreshCw size={14} />, label: 'Tokens', value: `~${stats.estimatedTokens.toLocaleString()}` },
            ].map((item) => (
              <div key={item.label} className="status-pill" style={{ justifyContent: 'center', borderRadius: '12px' }}>
                {item.icon}
                <span>{item.label}</span>
                <strong style={{ color: 'var(--text-primary)' }}>{item.value}</strong>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', color: 'var(--danger-color)' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '14px',
              background: dragActive ? 'rgba(124, 156, 255, 0.12)' : 'var(--bg-secondary)',
              cursor: 'pointer',
            }}
          >
            {isImporting ? (
              <div>
                <RefreshCw size={32} style={{ color: 'var(--accent-color)' }} />
                <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {t('wp.importing', { current: importProgress.current, total: importProgress.total })}
                </p>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: dragActive ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
                <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>{t('wp.drop.title')}</p>
                <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('wp.drop.hint')}</p>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" multiple {...{ webkitdirectory: '', directory: '' }} style={{ display: 'none' }} onChange={handleFileSelect} />

          {files.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => handleSelectAll(true)}>
                  <CheckSquare size={14} style={{ marginRight: '4px' }} />
                  {t('wp.selectAll')}
                </button>
                <button className="btn btn-secondary" onClick={() => handleSelectAll(false)}>
                  <Square size={14} style={{ marginRight: '4px' }} />
                  {t('wp.deselectAll')}
                </button>
              </div>
              <button className="btn btn-danger" onClick={handleClear}>
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                {t('wp.clear')}
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
            {files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '42px 20px', color: 'var(--text-secondary)' }}>
                <FolderOpen size={46} style={{ opacity: 0.35, marginBottom: '12px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('wp.empty.title')}</div>
                <div style={{ fontSize: '12px' }}>{t('wp.empty.desc')}</div>
              </div>
            ) : (
              fileTree.map((node) => renderTreeNode(node))
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t('wp.close')}</button>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePanel
