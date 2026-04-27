import React, { useState, useCallback } from 'react'
import { Upload, X, FileCode, FileJson, FileType } from 'lucide-react'

interface DropZoneProps {
  onFilesDrop: (files: Array<{ name: string; content: string }>) => void
  onClose: () => void
  acceptedTypes?: string[]
}

const DropZone: React.FC<DropZoneProps> = ({
  onFilesDrop,
  onClose,
  acceptedTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.json', '.md', '.txt']
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<Array<{ name: string; content: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setError(null)

    const files: Array<{ name: string; content: string }> = []
    const items = e.dataTransfer.items

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            const content = await file.text()
            files.push({ name: file.name, content })
          }
        }
      }
    } else {
      const fileList = e.dataTransfer.files
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const content = await file.text()
        files.push({ name: file.name, content })
      }
    }

    // 过滤文件类型
    const validFiles = files.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return acceptedTypes.includes(ext)
    })

    if (validFiles.length === 0) {
      setError(`不支持的文件类型。请上传: ${acceptedTypes.join(', ')}`)
      return
    }

    setDroppedFiles(validFiles)
  }, [acceptedTypes])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const files: Array<{ name: string; content: string }> = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const content = await file.text()
      files.push({ name: file.name, content })
    }

    const validFiles = files.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return acceptedTypes.includes(ext)
    })

    if (validFiles.length === 0) {
      setError(`不支持的文件类型。请上传: ${acceptedTypes.join(', ')}`)
      return
    }

    setDroppedFiles(validFiles)
  }, [acceptedTypes])

  const handleConfirm = () => {
    onFilesDrop(droppedFiles)
    onClose()
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) return <FileCode size={20} />
    if (['json'].includes(ext || '')) return <FileJson size={20} />
    return <FileType size={20} />
  }

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
          maxWidth: '500px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>导入文件</h3>
          <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!droppedFiles.length ? (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                background: isDragging ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-secondary)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              <Upload size={48} style={{ marginBottom: '16px', color: 'var(--accent-color)', opacity: 0.8 }} />
              <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
                拖拽文件到此处，或
              </p>
              <label
                style={{
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                点击选择文件
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                  accept={acceptedTypes.join(',')}
                />
              </label>
              <p style={{ margin: '16px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                支持: {acceptedTypes.join(', ')}
              </p>
            </div>

            {error && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', color: '#ef4444', fontSize: '13px' }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                即将导入 {droppedFiles.length} 个文件：
              </p>
              {droppedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  {getFileIcon(file.name)}
                  <span style={{ fontSize: '13px', flex: 1 }}>{file.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {(file.content.length / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDroppedFiles([])}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                重新选择
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                确认导入
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DropZone
