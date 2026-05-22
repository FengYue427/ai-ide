import { useState } from 'react'
import { FileText, Folder, Plus, Trash2 } from 'lucide-react'
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
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const showNewFileInput = useIDEStore((s) => s.showNewFileInput)
  const newFileName = useIDEStore((s) => s.newFileName)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setNewFileName = useIDEStore((s) => s.setNewFileName)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)

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
          <div className="sidebar-file-list">
            {files.map((file, idx) => (
              <div
                key={idx}
                className={`sidebar-file-item ${idx === activeFile ? 'active' : ''}`}
                onClick={() => setActiveFile(idx)}
              >
                <FileText size={14} color={idx === activeFile ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                <div className="sidebar-file-meta">
                  <div className="sidebar-file-name">{file.name}</div>
                  <div className="sidebar-file-language">{file.language}</div>
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
            ))}
          </div>
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
