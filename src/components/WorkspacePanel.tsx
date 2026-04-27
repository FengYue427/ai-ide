import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  FolderOpen, X, Upload, FileText, Trash2, Check, CheckSquare, Square, 
  Folder, ChevronRight, ChevronDown, RefreshCw, HardDrive, AlertCircle,
  FileCode, FileJson, FileType, File as FileIcon
} from 'lucide-react'
import { workspaceContextService, type WorkspaceFile } from '../services/workspaceContextService'

interface WorkspacePanelProps {
  onClose: () => void
  onFilesChange?: (files: { name: string; content: string; language: string }[]) => void
  currentFiles?: { name: string; content: string; language: string }[]  // 当前编辑器中的文件
}

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
  file?: WorkspaceFile
}

const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ onClose, onFilesChange, currentFiles }) => {
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [stats, setStats] = useState(workspaceContextService.getStats())
  const [dragActive, setDragActive] = useState(false)
  const hasSyncedFiles = useRef(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 刷新文件列表
  const refreshFiles = useCallback(() => {
    const allFiles = workspaceContextService.getAllFiles()
    setFiles(allFiles)
    setStats(workspaceContextService.getStats())
    
    // 通知父组件文件变化
    if (onFilesChange) {
      const fileData = allFiles.map(f => ({
        name: f.name,
        content: f.content,
        language: f.language
      }))
      onFilesChange(fileData)
    }
  }, [onFilesChange])

  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  // 同步当前编辑器文件到工作区（如果工作区为空）
  useEffect(() => {
    if (currentFiles && currentFiles.length > 0 && !hasSyncedFiles.current) {
      const workspaceFiles = workspaceContextService.getAllFiles()
      // 如果工作区为空，自动同步当前文件
      if (workspaceFiles.length === 0) {
        workspaceContextService.createFromFiles(currentFiles, '当前项目')
        refreshFiles()
        hasSyncedFiles.current = true
      }
    }
  }, [currentFiles, refreshFiles])

  // 处理文件拖放
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const items = e.dataTransfer.items
    if (!items) return

    setIsImporting(true)
    let totalFiles = 0
    let processedFiles = 0

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry()
        
        if (entry) {
          if (entry.isFile) {
            totalFiles++
          } else if (entry.isDirectory) {
            // 粗略估计文件夹中的文件数
            totalFiles += 10
          }
        }
      }

      setImportProgress({ current: 0, total: totalFiles })

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry()
        
        if (entry) {
          if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry
            await new Promise<void>((resolve, reject) => {
              fileEntry.file(async (file) => {
                try {
                  await workspaceContextService.addFileFromLocal(file)
                  processedFiles++
                  setImportProgress({ current: processedFiles, total: totalFiles })
                  resolve()
                } catch (e) {
                  reject(e)
                }
              }, reject)
            })
          } else if (entry.isDirectory) {
            const dirEntry = entry as FileSystemDirectoryEntry
            const result = await workspaceContextService.addFilesFromDirectory(dirEntry)
            processedFiles += result.success
            setImportProgress({ current: processedFiles, total: totalFiles })
            
            if (result.errors.length > 0) {
              console.warn('Some files failed to import:', result.errors)
            }
          }
        }
      }

      refreshFiles()
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setIsImporting(false)
      setImportProgress({ current: 0, total: 0 })
    }
  }, [refreshFiles])

  // 处理文件选择
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsImporting(true)
    setError(null)
    
    try {
      const fileArray = Array.from(files)
      const result = await workspaceContextService.addFilesFromLocal(fileArray)
      
      if (result.failed > 0) {
        console.warn('Some files failed to import:', result.errors)
      }
      
      refreshFiles()
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setIsImporting(false)
      e.target.value = '' // 重置input
    }
  }, [refreshFiles])

  // 删除文件
  const handleRemoveFile = useCallback((path: string) => {
    workspaceContextService.removeFile(path)
    refreshFiles()
  }, [refreshFiles])

  // 切换文件选择
  const handleToggleSelect = useCallback((path: string) => {
    workspaceContextService.toggleFileSelection(path)
    refreshFiles()
  }, [refreshFiles])

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    workspaceContextService.selectAllFiles(selected)
    refreshFiles()
  }, [refreshFiles])

  // 清空工作区
  const handleClear = useCallback(() => {
    if (confirm('确定要清空工作区吗？所有文件将被删除。')) {
      workspaceContextService.clearContext()
      refreshFiles()
    }
  }, [refreshFiles])

  // 切换文件夹展开状态
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  // 构建文件树
  const buildFileTree = useCallback((): FileTreeNode[] => {
    const root: FileTreeNode[] = []
    
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean)
      let currentLevel = root
      let currentPath = ''
      
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isLast = index === parts.length - 1
        
        const existingNode = currentLevel.find(node => node.name === part)
        
        if (existingNode) {
          if (!isLast) {
            currentLevel = existingNode.children!
          }
        } else {
          if (isLast) {
            const newNode: FileTreeNode = {
              name: part,
              path: currentPath,
              type: 'file',
              file
            }
            currentLevel.push(newNode)
          } else {
            const newNode: FileTreeNode = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: []
            }
            currentLevel.push(newNode)
            currentLevel = newNode.children!
          }
        }
      })
    })
    
    return root
  }, [files])

  // 获取文件图标
  const getFileIcon = (language: string) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <FileCode size={16} style={{ color: '#f7df1e' }} />
      case 'json':
        return <FileJson size={16} style={{ color: '#fff' }} />
      case 'html':
        return <FileType size={16} style={{ color: '#e34c26' }} />
      case 'css':
      case 'scss':
      case 'sass':
        return <FileType size={16} style={{ color: '#264de4' }} />
      case 'python':
        return <FileCode size={16} style={{ color: '#3776ab' }} />
      case 'markdown':
        return <FileText size={16} style={{ color: '#fff' }} />
      default:
        return <FileIcon size={16} style={{ color: 'var(--text-secondary)' }} />
    }
  }

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 渲染文件树节点
  const renderTreeNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const paddingLeft = 12 + depth * 16

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleFolder(node.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              paddingLeft: `${paddingLeft}px`,
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={16} style={{ color: '#ffd700' }} />
            <span style={{ flex: 1 }}>{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
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
          padding: '6px 12px',
          paddingLeft: `${paddingLeft}px`,
          borderBottom: '1px solid var(--border-color)',
          background: file.selected !== false ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
        }}
      >
        <div
          onClick={() => handleToggleSelect(file.path)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {file.selected !== false ? (
            <CheckSquare size={16} style={{ color: 'var(--accent-color)' }} />
          ) : (
            <Square size={16} style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
        {getFileIcon(file.language)}
        <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>
          {node.name}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {formatSize(file.size)}
        </span>
        <div
          onClick={() => handleRemoveFile(file.path)}
          style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
          className="hover-danger"
        >
          <Trash2 size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    )
  }

  const fileTree = buildFileTree()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal" 
        style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} />
            工作区管理
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* 统计信息 */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HardDrive size={14} style={{ color: 'var(--accent-color)' }} />
              <span>{stats.totalFiles} 文件</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={14} style={{ color: 'var(--accent-color)' }} />
              <span>{stats.selectedFiles} 选中</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={14} style={{ color: 'var(--accent-color)' }} />
              <span>{formatSize(stats.totalSize)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={14} style={{ color: 'var(--accent-color)' }} />
              <span>~{stats.estimatedTokens.toLocaleString()} tokens</span>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#ef4444'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* 拖放区域 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {isImporting ? (
              <div>
                <RefreshCw size={32} style={{ color: 'var(--accent-color)', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  正在导入... {importProgress.current} / {importProgress.total}
                </p>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: dragActive ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  拖放文件或文件夹到这里
                </p>
                <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  或点击选择文件，支持多文件和整个文件夹
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            {...{ webkitdirectory: '', directory: '' }}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* 文件列表操作 */}
          {files.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSelectAll(true)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <CheckSquare size={14} style={{ marginRight: '4px' }} />
                  全选
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSelectAll(false)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <Square size={14} style={{ marginRight: '4px' }} />
                  取消全选
                </button>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleClear}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                清空
              </button>
            </div>
          )}

          {/* 文件列表 */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--bg-primary)'
          }}>
            {files.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: 'var(--text-secondary)'
              }}>
                <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>工作区为空</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  拖放文件或文件夹开始构建项目上下文
                </p>
              </div>
            ) : (
              fileTree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePanel
