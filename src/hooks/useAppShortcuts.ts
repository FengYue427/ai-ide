import { getDefaultShortcuts, useKeyboardShortcuts } from './useKeyboardShortcuts'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import type { FileItem } from '../types/file'

interface UseAppShortcutsOptions {
  files: FileItem[]
  handleRunCode: () => Promise<void>
  handleDebugContinue: () => Promise<void>
  handleDebugStepOver: () => Promise<void>
  handleDebugStepInto: () => Promise<void>
  handleDebugStepOut: () => Promise<void>
  handleStopDebug: () => void
  openCommandPalette: () => void
  openImportDialog: () => void
  openNewFileInput: () => void
  openSearchPanel: () => void
  toggleTerminalPanel: () => void
  toggleGitPanel: () => void
  openTerminalPanel: () => void
  openScriptsPanel: () => void
  openTasksPanel: () => void
  openDebugPanel: () => void
  onFormat?: () => void
}

export function useAppShortcuts({
  files,
  handleRunCode,
  handleDebugContinue,
  handleDebugStepOver,
  handleDebugStepInto,
  handleDebugStepOut,
  handleStopDebug,
  openCommandPalette,
  openImportDialog,
  openNewFileInput,
  openSearchPanel,
  toggleTerminalPanel,
  toggleGitPanel,
  openTerminalPanel,
  openScriptsPanel,
  openTasksPanel,
  openDebugPanel,
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
      onToggleGitPanel: toggleGitPanel,
      onOpenTerminalTab: openTerminalPanel,
      onOpenScriptsTab: openScriptsPanel,
      onOpenTasksTab: openTasksPanel,
      onOpenDebugTab: openDebugPanel,
      onFormat,
      onDebugContinue: () => {
        void handleDebugContinue()
      },
      onDebugStepOver: () => {
        void handleDebugStepOver()
      },
      onDebugStepInto: () => {
        void handleDebugStepInto()
      },
      onDebugStepOut: () => {
        void handleDebugStepOut()
      },
      onDebugStop: handleStopDebug,
    }),
    true,
  )
}
