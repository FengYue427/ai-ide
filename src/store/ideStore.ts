import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FileItem {
  name: string
  content: string
  language: string
}

interface IDEState {
  // 文件
  files: FileItem[]
  activeFile: number
  openedFiles: number[] // 多标签
  
  // UI 状态
  theme: 'vs-dark' | 'light'
  sidebarVisible: boolean
  terminalVisible: boolean
  gitPanelVisible: boolean
  previewVisible: boolean
  searchVisible: boolean
  
  // 搜索
  searchQuery: string
  searchResults: { file: string; line: number; content: string }[]
  
  // 操作
  setFiles: (files: FileItem[]) => void
  addFile: (file: FileItem) => void
  updateFile: (index: number, content: string) => void
  deleteFile: (index: number) => void
  setActiveFile: (index: number) => void
  openFile: (index: number) => void
  closeFile: (index: number) => void
  
  setTheme: (theme: 'vs-dark' | 'light') => void
  toggleSidebar: () => void
  toggleTerminal: () => void
  toggleGitPanel: () => void
  togglePreview: () => void
  toggleSearch: () => void
  
  setSearchQuery: (query: string) => void
  setSearchResults: (results: { file: string; line: number; content: string }[]) => void
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      files: [{ name: 'index.js', content: '// 欢迎使用 AI IDE\nconsole.log("Hello World!");', language: 'javascript' }],
      activeFile: 0,
      openedFiles: [0],
      theme: 'vs-dark',
      sidebarVisible: true,
      terminalVisible: false,
      gitPanelVisible: false,
      previewVisible: false,
      searchVisible: false,
      searchQuery: '',
      searchResults: [],

      setFiles: (files) => set({ files, activeFile: 0, openedFiles: files.length > 0 ? [0] : [] }),
      
      addFile: (file) => set((state) => {
        const newIndex = state.files.length
        return {
          files: [...state.files, file],
          activeFile: newIndex,
          openedFiles: [...state.openedFiles, newIndex]
        }
      }),
      
      updateFile: (index, content) => set((state) => {
        const newFiles = [...state.files]
        newFiles[index] = { ...newFiles[index], content }
        return { files: newFiles }
      }),
      
      deleteFile: (index) => set((state) => {
        const newFiles = state.files.filter((_, i) => i !== index)
        const newOpened = state.openedFiles.filter(i => i !== index).map(i => i > index ? i - 1 : i)
        let newActive = state.activeFile
        if (newActive === index) {
          newActive = newOpened.length > 0 ? newOpened[0] : -1
        } else if (newActive > index) {
          newActive--
        }
        return { files: newFiles, openedFiles: newOpened, activeFile: newActive }
      }),
      
      setActiveFile: (index) => set({ activeFile: index }),
      
      openFile: (index) => set((state) => ({
        activeFile: index,
        openedFiles: state.openedFiles.includes(index) ? state.openedFiles : [...state.openedFiles, index]
      })),
      
      closeFile: (index) => set((state) => {
        const newOpened = state.openedFiles.filter(i => i !== index)
        let newActive = state.activeFile
        if (state.activeFile === index) {
          newActive = newOpened.length > 0 ? newOpened[newOpened.length - 1] : -1
        }
        return { openedFiles: newOpened, activeFile: newActive }
      }),

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
      toggleGitPanel: () => set((state) => ({ gitPanelVisible: !state.gitPanelVisible })),
      togglePreview: () => set((state) => ({ previewVisible: !state.previewVisible })),
      toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results })
    }),
    {
      name: 'ai-ide-storage',
      partialize: (state) => ({ 
        files: state.files, 
        theme: state.theme,
        sidebarVisible: state.sidebarVisible,
        terminalVisible: state.terminalVisible
      })
    }
  )
)
