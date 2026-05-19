import { useCallback } from 'react'
import JSZip from 'jszip'
import type { FileItem } from '../types/file'
import { workspaceContextService } from '../services/workspaceContextService'
import { clearSemanticSearchCache } from '../services/semanticSearchService'

type Notify = (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void

interface EditorTarget {
  line: number
  column?: number
  nonce: number
}

interface UseFileActionsOptions {
  activeFile: number
  files: FileItem[]
  newFileName: string
  notify: Notify
  setActiveFile: (index: number) => void
  setEditorTarget?: (target: EditorTarget | null) => void
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  setNewFileName: (name: string) => void
  setShowDropZone: (show: boolean) => void
  setShowNewFileInput: (show: boolean) => void
  getLanguageFromExt: (filename: string) => string
}

export function useFileActions({
  activeFile,
  files,
  newFileName,
  notify,
  setActiveFile,
  setEditorTarget,
  setFiles,
  setNewFileName,
  setShowDropZone,
  setShowNewFileInput,
  getLanguageFromExt,
}: UseFileActionsOptions) {
  const handleImportFiles = useCallback(
    (importedFiles: { name: string; content: string }[]) => {
      const filesWithLang = importedFiles.map((file) => ({
        ...file,
        language: getLanguageFromExt(file.name),
      }))
      setFiles(filesWithLang)
      setActiveFile(0)
      setShowDropZone(false)
      notify('success', '文件已导入', `共导入 ${filesWithLang.length} 个文件。`)
    },
    [getLanguageFromExt, notify, setActiveFile, setFiles, setShowDropZone],
  )

  const handleSearchNavigate = useCallback(
    (fileName: string, line: number, column = 1) => {
      const fileIndex = files.findIndex((file) => file.name === fileName)
      if (fileIndex >= 0) {
        setActiveFile(fileIndex)
        setEditorTarget?.({ line, column, nonce: Date.now() })
      }
    },
    [files, setActiveFile, setEditorTarget],
  )

  const handleSearchReplace = useCallback(
    (fileName: string, newContent: string) => {
      if (workspaceContextService.getFile(fileName)) {
        void workspaceContextService.updateFile(fileName, newContent)
        clearSemanticSearchCache()
      }

      const fileIndex = files.findIndex((file) => file.name === fileName)
      if (fileIndex >= 0) {
        const nextFiles = [...files]
        nextFiles[fileIndex] = { ...nextFiles[fileIndex], content: newContent }
        setFiles(nextFiles)
        return
      }

      setFiles([
        ...files,
        {
          name: fileName,
          content: newContent,
          language: getLanguageFromExt(fileName),
        },
      ])
      setActiveFile(files.length)
      setEditorTarget?.({ line: 1, column: 1, nonce: Date.now() })
    },
    [files, getLanguageFromExt, setActiveFile, setEditorTarget, setFiles],
  )

  const handleCreateFile = useCallback(() => {
    if (!newFileName.trim()) return

    const name = newFileName.trim()
    if (files.some((file) => file.name === name)) {
      notify('error', '文件已存在', '请换一个文件名后再创建。')
      return
    }

    const newFile: FileItem = {
      name,
      content: '',
      language: getLanguageFromExt(name),
    }

    setFiles([...files, newFile])
    setActiveFile(files.length)
    setEditorTarget?.({ line: 1, column: 1, nonce: Date.now() })
    setNewFileName('')
    setShowNewFileInput(false)
    notify('success', '文件已创建', name)
  }, [files, getLanguageFromExt, newFileName, notify, setActiveFile, setEditorTarget, setFiles, setNewFileName, setShowNewFileInput])

  const handleDeleteFile = useCallback(
    (index: number) => {
      if (files.length <= 1) {
        notify('info', '至少保留一个文件', '当前工作区需要保留一个可编辑文件。')
        return
      }

      const deletedFile = files[index]
      const nextFiles = files.filter((_, fileIndex) => fileIndex !== index)
      setFiles(nextFiles)
      if (activeFile >= index && activeFile > 0) {
        setActiveFile(activeFile - 1)
      }
      notify('success', '文件已删除', deletedFile?.name)
    },
    [activeFile, files, notify, setActiveFile, setFiles],
  )

  const handleExportFile = useCallback(() => {
    const file = files[activeFile]
    if (!file) return

    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
    notify('success', '文件已导出', file.name)
  }, [activeFile, files, notify])

  const handleExportZip = useCallback(async () => {
    try {
      const zip = new JSZip()
      files.forEach((file) => {
        zip.file(file.name, file.content)
      })

      zip.file(
        '.aide-project.json',
        JSON.stringify(
          {
            name: 'AI IDE Project',
            exportedAt: new Date().toISOString(),
            fileCount: files.length,
            files: files.map((file) => ({ name: file.name, language: file.language })),
          },
          null,
          2,
        ),
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `project-${Date.now()}.zip`
      link.click()
      URL.revokeObjectURL(url)
      notify('success', '项目 ZIP 已导出', `${files.length} 个文件已打包。`)
    } catch (error) {
      console.error('导出 ZIP 失败:', error)
      notify('error', '导出 ZIP 失败', error instanceof Error ? error.message : '打包失败')
    }
  }, [files, notify])

  return {
    handleCreateFile,
    handleDeleteFile,
    handleExportFile,
    handleExportZip,
    handleImportFiles,
    handleSearchNavigate,
    handleSearchReplace,
  }
}
