import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Folder, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { SymbolOutline } from '../components/SymbolOutline'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'

interface FileSidebarProps {
  onCreateFile: () => void
  onDeleteFile: (index: number) => void
  onOpenDropZone: () => void
}

export function FileSidebar({ onCreateFile, onDeleteFile, onOpenDropZone }: FileSidebarProps) {
  const { t } = useI18n()
  const [outlineCollapsed, setOutlineCollapsed] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const showNewFileInput = useIDEStore((s) => s.showNewFileInput)
  const newFileName = useIDEStore((s) => s.newFileName)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setNewFileName = useIDEStore((s) => s.setNewFileName)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)

  type TreeNode = {
    name: string
    path: string
    kind: 'file' | 'folder'
    fileIndex?: number
    children?: TreeNode[]
  }

  const fileTree = useMemo<TreeNode[]>(() => {
    const root: TreeNode[] = []
    files.forEach((file, idx) => {
      const parts = file.name.split('/').filter(Boolean)
      let current = root
      let currentPath = ''

      parts.forEach((part, partIndex) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isLeaf = partIndex === parts.length - 1
        let node = current.find((item) => item.name === part && item.kind === (isLeaf ? 'file' : 'folder'))
        if (!node) {
          node = isLeaf
            ? { name: part, path: currentPath, kind: 'file', fileIndex: idx }
            : { name: part, path: currentPath, kind: 'folder', children: [] }
          current.push(node)
        }
        if (!isLeaf) current = node.children!
      })
    })

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      nodes.forEach((node) => node.children && sortNodes(node.children))
    }

    sortNodes(root)
    return root
  }, [files])

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
    if (node.kind === 'folder') {
      const open = expandedFolders.has(node.path)
      return (
        <div key={node.path}>
          <button
            type="button"
            className="sidebar-tree-item sidebar-tree-item--folder"
            style={{ paddingLeft: `${12 + depth * 14}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={13} />
            <span>{node.name}</span>
          </button>
          {open && node.children?.map((child) => renderNode(child, depth + 1))}
        </div>
      )
    }

    const idx = node.fileIndex ?? 0
    const file = files[idx]
    return (
      <div
        key={node.path}
        className={`sidebar-file-item ${idx === activeFile ? 'active' : ''}`}
        onClick={() => setActiveFile(idx)}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        <FileText size={14} color={idx === activeFile ? 'var(--accent-color)' : 'var(--text-secondary)'} />
        <div className="sidebar-file-meta">
          <div className="sidebar-file-name">{node.name}</div>
          <div className="sidebar-file-language">{file?.language}</div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteFile(idx)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'var(--text-secondary)',
            display: files.length > 1 ? 'flex' : 'none',
            alignItems: 'center',
          }}
          title={t('sidebar.deleteFile')}
        >
          <Trash2 size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Folder size={14} style={{ marginRight: 6 }} />
          {t('sidebar.files')}
        </div>
        <button
          type="button"
          onClick={() => setShowNewFileInput(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="sidebar-section">
        {showNewFileInput && (
          <div className="sidebar-input-row">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCreateFile()}
              placeholder={t('sidebar.filenamePlaceholder')}
              className="sidebar-input"
              autoFocus
            />
            <button
              type="button"
              onClick={onCreateFile}
              style={{
                padding: '10px 12px',
                fontSize: 12,
                background: 'var(--accent-color)',
                border: 'none',
                borderRadius: 10,
                color: 'var(--bg-primary)',
                cursor: 'pointer',
              }}
            >
              {t('sidebar.create')}
            </button>
          </div>
        )}
        {files.length === 0 ? (
          <EmptyState type="files" onAction={() => setShowNewFileInput(true)} onSecondaryAction={onOpenDropZone} />
        ) : (
          <div className="sidebar-file-list">{fileTree.map((node) => renderNode(node))}</div>
        )}
      </div>

      {files.length > 0 && (
        <SymbolOutline
          collapsed={outlineCollapsed}
          onToggleCollapsed={() => setOutlineCollapsed((value) => !value)}
        />
      )}
    </div>
  )
}
