import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('aiIdeDesktop', {
  isDesktop: true,
  shellMode: () => ipcRenderer.invoke('desktop:shell-mode'),
  pickProjectFolder: () => ipcRenderer.invoke('desktop:pick-folder'),
  restoreLastProject: () => ipcRenderer.invoke('desktop:restore-last'),
  scanProject: (rootPath) => ipcRenderer.invoke('desktop:scan-project', rootPath),
  readFile: (rootPath, relPath, startLine, endLine) =>
    ipcRenderer.invoke('desktop:read-file', { rootPath, relPath, startLine, endLine }),
  writeFile: (rootPath, relPath, content) =>
    ipcRenderer.invoke('desktop:write-file', { rootPath, relPath, content }),
  runCommand: (rootPath, commandLine) =>
    ipcRenderer.invoke('desktop:run-command', { rootPath, commandLine }),
  getInfo: () => ipcRenderer.invoke('desktop:info'),
  onProjectOpened: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:project-opened', listener)
    return () => ipcRenderer.removeListener('desktop:project-opened', listener)
  },
})
