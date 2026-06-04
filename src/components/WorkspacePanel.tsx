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
  FolderPlus,
  HardDrive,
  RefreshCw,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { projectIndexManager } from '../services/projectIndexManager'
import { workspaceContextService, type WorkspaceFile } from '../services/workspaceContextService'
import { syncToLocalDisk } from '../services/localProjectSync'
import {
  localProjectService,
  supportsLocalProject,
} from '../services/localProjectService'
import {
  openLocalProjectIntoWorkspace,
  restoreLocalProjectIntoWorkspace,
} from '../services/localProjectBridge'
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
  const [localRoot, setLocalRoot] = useState<string | null>(localProjectService.getRootName())
  const canLocalDisk = supportsLocalProject()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasSyncedFiles = useRef(false)
  const [focusedPath, setFocusedPath] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string
    kind: 'file' | 'folder'
  } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  const refreshFiles = useCallback(() => {
    const allFiles = workspaceContextService.getAllFiles()
    setFiles(allFiles)
    setStats(workspaceContextService.getStats())

    const mapped = allFiles.map((file) => ({
      name: file.path,
      content: file.content,
      language: file.language,
    }))
    if (mapped.length > 0) {
      projectIndexManager.forceRebuildFromWorkspace(mapped)
    }
    if (onFilesChange) {
      onFilesChange(mapped)
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

  const handleOpenLocalProject = useCallback(async () => {
    setError(null)
    setIsImporting(true)
    try {
      const result = await openLocalProjectIntoWorkspace()
      setLocalRoot(result.rootName)
      refreshFiles()
      const detail = result.capped
        ? t('wp.local.openDetailCapped', { count: result.imported })
        : t('wp.local.openDetail', { count: result.imported })
      notify('success', t('wp.local.openTitle', { name: result.rootName }), detail)
      if (result.errors.length > 0) {
        notify('info', t('wp.notify.partialImport'), result.errors.slice(0, 3).join('; '))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'LOCAL_PROJECT_UNSUPPORTED') {
        setError(t('wp.local.unsupported'))
      } else if (msg === 'LOCAL_PROJECT_PERMISSION_DENIED') {
        setError(t('wp.local.permissionDenied'))
      } else {
        setError(t('wp.local.openFailed'))
      }
    } finally {
      setIsImporting(false)
    }
  }, [notify, refreshFiles, t])

  const handleRestoreLocalProject = useCallback(async () => {
    setError(null)
    setIsImporting(true)
    try {
      const result = await restoreLocalProjectIntoWorkspace()
      if (!result) {
        notify('info', t('wp.local.restoreNone'))
        return
      }
      setLocalRoot(result.rootName)
      refreshFiles()
      notify('success', t('wp.local.restoreTitle'), t('wp.local.openDetail', { count: result.imported }))
    } catch {
      setError(t('wp.local.openFailed'))
    } finally {
      setIsImporting(false)
    }
  }, [notify, refreshFiles, t])

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

  const pathKind = useCallback(
    (path: string): 'file' | 'folder' => {
      if (workspaceContextService.getFile(path)) return 'file'
      return files.some((f) => f.path.startsWith(`${path}/`)) ? 'folder' : 'file'
    },
    [files],
  )

  const startRename = useCallback((path: string) => {
    setRenamingPath(path)
    setRenameDraft(path.split('/').pop() ?? path)
    setContextMenu(null)
  }, [])

  const commitRename = useCallback(async () => {
    if (!renamingPath) return
    const nextName = renameDraft.trim()
    if (!nextName) {
      setRenamingPath(null)
      return
    }
    const parent = renamingPath.includes('/') ? renamingPath.slice(0, renamingPath.lastIndexOf('/')) : ''
    const newPath = parent ? `${parent}/${nextName}` : nextName

    try {
      const before = workspaceContextService.getFile(renamingPath)
      const count = await workspaceContextService.renamePath(renamingPath, newPath)
      if (before && count === 1) {
        projectIndexManager.removeFile(renamingPath)
        projectIndexManager.patchFile({ path: newPath, content: before.content, language: before.language })
        await syncToLocalDisk(newPath, before.content)
      }
      setRenamingPath(null)
      refreshFiles()
      notify('success', t('wp.notify.renamed'), t('wp.notify.renamedDetail', { count }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : ''
      if (msg === 'TARGET_EXISTS') {
        notify('error', t('wp.rename.exists'))
      } else {
        notify('error', t('wp.rename.failed'))
      }
    }
  }, [renamingPath, renameDraft, refreshFiles, notify, t])

  const handleDeletePath = useCallback(
    async (path: string) => {
      const kind = pathKind(path)
      const confirmed = await requestConfirm({
        title: kind === 'folder' ? t('wp.confirm.deleteFolder.title') : t('wp.confirm.deleteFile.title'),
        message:
          kind === 'folder'
            ? t('wp.confirm.deleteFolder.message', { path })
            : t('wp.confirm.deleteFile.message', { path }),
        confirmText: t('wp.confirm.deleteFile.confirm'),
        tone: 'danger',
      })
      if (!confirmed) return

      const removed = await workspaceContextService.deletePath(path)
      if (removed > 0) {
        refreshFiles()
        notify('success', t('wp.notify.deleted'), t('wp.notify.deletedDetail', { count: removed }))
      }
      setContextMenu(null)
      if (focusedPath === path) setFocusedPath(null)
    },
    [focusedPath, notify, pathKind, refreshFiles, requestConfirm, t],
  )

  const handleMovePath = useCallback(
    async (path: string) => {
      setContextMenu(null)
      const target = window.prompt(t('wp.move.prompt'), path)
      if (!target?.trim() || target.trim() === path) return
      try {
        const before = workspaceContextService.getFile(path)
        const count = await workspaceContextService.renamePath(path, target.trim())
        if (before && count === 1) {
          projectIndexManager.removeFile(path)
          projectIndexManager.patchFile({
            path: target.trim(),
            content: before.content,
            language: before.language,
          })
          await syncToLocalDisk(target.trim(), before.content)
        }
        refreshFiles()
        notify('success', t('wp.notify.moved'), target.trim())
      } catch (error) {
        const msg = error instanceof Error ? error.message : ''
        if (msg === 'TARGET_EXISTS') notify('error', t('wp.rename.exists'))
        else notify('error', t('wp.rename.failed'))
      }
    },
    [notify, refreshFiles, t],
  )

  const submitNewFolder = useCallback(async () => {
    const name = newFolderName.trim()
    if (!name) return
    const fullPath = newFolderParent ? `${newFolderParent}/${name}` : name
    try {
      await workspaceContextService.createDirectory(fullPath)
      setExpandedFolders((current) => new Set(current).add(fullPath))
      setNewFolderParent(null)
      setNewFolderName('')
      refreshFiles()
      notify('success', t('wp.notify.folderCreated'), fullPath)
    } catch {
      notify('error', t('wp.newFolder.failed'))
    }
  }, [newFolderName, newFolderParent, notify, refreshFiles, t])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (renamingPath || newFolderParent !== null) return
      if (!focusedPath) return
      if (event.key === 'F2') {
        event.preventDefault()
        startRename(focusedPath)
      }
      if (event.key === 'Delete') {
        event.preventDefault()
        void handleDeletePath(focusedPath)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusedPath, handleDeletePath, newFolderParent, renamingPath, startRename])

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

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
      const isFocused = focusedPath === node.path
      const isRenaming = renamingPath === node.path
      return (
        <div key={node.path}>
          <div
            onClick={() => {
              setFocusedPath(node.path)
              toggleFolder(node.path)
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setFocusedPath(node.path)
              setContextMenu({ x: event.clientX, y: event.clientY, path: node.path, kind: 'folder' })
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              paddingLeft,
              cursor: 'pointer',
              fontSize: '13px',
              borderBottom: '1px solid var(--border-color)',
              background: isFocused ? 'rgba(124, 156, 255, 0.14)' : 'transparent',
              outline: isFocused ? '1px solid var(--accent-color)' : 'none',
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={16} style={{ color: '#fbbf24' }} />
            {isRenaming ? (
              <input
                autoFocus
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === 'Enter') void commitRename()
                  if (event.key === 'Escape') setRenamingPath(null)
                }}
                onBlur={() => void commitRename()}
                style={{ flex: 1, fontSize: '13px', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--accent-color)' }}
              />
            ) : (
              <span style={{ flex: 1 }}>{node.name}</span>
            )}
          </div>
          {isExpanded && node.children?.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      )
    }

    const file = node.file!
    if (file.name === '.gitkeep') return null

    const isFocused = focusedPath === file.path
    const isRenaming = renamingPath === file.path
    return (
      <div
        key={node.path}
        onClick={() => setFocusedPath(file.path)}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setFocusedPath(file.path)
          setContextMenu({ x: event.clientX, y: event.clientY, path: file.path, kind: 'file' })
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          paddingLeft,
          borderBottom: '1px solid var(--border-color)',
          background: isFocused
            ? 'rgba(124, 156, 255, 0.14)'
            : file.selected !== false
              ? 'rgba(124, 156, 255, 0.10)'
              : 'transparent',
          outline: isFocused ? '1px solid var(--accent-color)' : 'none',
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            handleToggleSelect(file.path)
          }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
          title={t('wp.toggleSelect')}
        >
          {file.selected !== false ? <CheckSquare size={16} style={{ color: 'var(--accent-color)' }} /> : <Square size={16} />}
        </button>
        {getFileIcon(file.language)}
        {isRenaming ? (
          <input
            autoFocus
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key === 'Enter') void commitRename()
              if (event.key === 'Escape') setRenamingPath(null)
            }}
            onBlur={() => void commitRename()}
            style={{ flex: 1, fontSize: '13px', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--accent-color)' }}
          />
        ) : (
          <span style={{ flex: 1, minWidth: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
        )}
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatSize(file.size)}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            void handleDeletePath(file.path)
          }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
          title={t('wp.ctx.delete')}
        >
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

          {canLocalDisk && (
            <div className="wp-local-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <button type="button" className="btn btn-primary" disabled={isImporting} onClick={() => void handleOpenLocalProject()}>
                <FolderOpen size={14} style={{ marginRight: '6px' }} />
                {t('wp.local.openFolder')}
              </button>
              <button type="button" className="btn btn-secondary" disabled={isImporting} onClick={() => void handleRestoreLocalProject()}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} />
                {t('wp.local.restore')}
              </button>
              {localRoot && (
                <span className="status-pill" style={{ alignSelf: 'center' }}>
                  <HardDrive size={14} />
                  {t('wp.local.bound', { name: localRoot })}
                </span>
              )}
            </div>
          )}

          {!canLocalDisk && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              {t('wp.local.unsupported')}
            </p>
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => handleSelectAll(true)}>
                  <CheckSquare size={14} style={{ marginRight: '4px' }} />
                  {t('wp.selectAll')}
                </button>
                <button className="btn btn-secondary" onClick={() => handleSelectAll(false)}>
                  <Square size={14} style={{ marginRight: '4px' }} />
                  {t('wp.deselectAll')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setNewFolderParent('')
                    setNewFolderName('')
                  }}
                >
                  <FolderPlus size={14} style={{ marginRight: '4px' }} />
                  {t('wp.newFolder.btn')}
                </button>
              </div>
              <button className="btn btn-danger" onClick={handleClear}>
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                {t('wp.clear')}
              </button>
            </div>
          )}

          {newFolderParent !== null && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
              }}
            >
              <FolderPlus size={14} color="var(--accent-color)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {newFolderParent ? `${newFolderParent}/` : ''}
              </span>
              <input
                autoFocus
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder={t('wp.newFolder.placeholder')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void submitNewFolder()
                  if (event.key === 'Escape') {
                    setNewFolderParent(null)
                    setNewFolderName('')
                  }
                }}
                style={{ flex: 1, fontSize: '13px', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <button type="button" className="btn btn-primary" onClick={() => void submitNewFolder()}>
                {t('wp.newFolder.create')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setNewFolderParent(null)
                  setNewFolderName('')
                }}
              >
                {t('wp.newFolder.cancel')}
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

      {contextMenu ? (
        <div
          role="menu"
          className="shell-dropdown"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {[
            { key: 'rename', label: t('wp.ctx.rename'), action: () => startRename(contextMenu.path) },
            { key: 'move', label: t('wp.ctx.move'), action: () => void handleMovePath(contextMenu.path) },
            ...(contextMenu.kind === 'folder'
              ? [
                  {
                    key: 'newfolder',
                    label: t('wp.ctx.newFolder'),
                    action: () => {
                      setNewFolderParent(contextMenu.path)
                      setNewFolderName('')
                      setContextMenu(null)
                    },
                  },
                ]
              : []),
            { key: 'delete', label: t('wp.ctx.delete'), action: () => void handleDeletePath(contextMenu.path) },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={item.action}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: item.key === 'delete' ? 'var(--danger-color)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default WorkspacePanel
