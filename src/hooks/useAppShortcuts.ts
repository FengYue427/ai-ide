import { getDefaultShortcuts, useKeyboardShortcuts } from './useKeyboardShortcuts'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import type { FileItem } from '../types/file'

interface UseAppShortcutsOptions {
  files: FileItem[]
  handleRunCode: () => Promise<void>
  openCommandPalette: () => void
  openImportDialog: () => void
  openNewFileInput: () => void
  openSearchPanel: () => void
  toggleTerminalPanel: () => void
  onFormat?: () => void
}

export function useAppShortcuts({
  files,
  handleRunCode,
  openCommandPalette,
  openImportDialog,
  openNewFileInput,
  openSearchPanel,
  toggleTerminalPanel,
  onFormat,
}: UseAppShortcutsOptions) {
  useKeyboardShortcuts(
    getDefaultShortcuts({
      onSave: () => {
        const ideFiles = files.map((file, index) => ({
          id: index.toString(),
          name: file.name,
          content: file.content,
          language: file.language,
          lastModified: Date.now(),
        }))

        unifiedStorage.set('autosave-default', ideFiles, { layer: StorageLayer.INDEXED })
      },
      onNewFile: openNewFileInput,
      onOpenFile: openImportDialog,
      onRun: handleRunCode,
      onSearch: openSearchPanel,
      onCommandPalette: openCommandPalette,
      onToggleTerminal: toggleTerminalPanel,
      onFormat,
    }),
    true,
  )
}
