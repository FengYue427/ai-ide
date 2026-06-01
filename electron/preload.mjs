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
  ptyCapabilities: () => ipcRenderer.invoke('desktop:pty-capabilities'),
  ptySpawn: (payload) => ipcRenderer.invoke('desktop:pty-spawn', payload),
  ptyWrite: (payload) => ipcRenderer.invoke('desktop:pty-write', payload),
  ptyResize: (payload) => ipcRenderer.invoke('desktop:pty-resize', payload),
  ptyKill: (payload) => ipcRenderer.invoke('desktop:pty-kill', payload),
  onPtyData: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:pty-data', listener)
    return () => ipcRenderer.removeListener('desktop:pty-data', listener)
  },
  onPtyExit: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:pty-exit', listener)
    return () => ipcRenderer.removeListener('desktop:pty-exit', listener)
  },
  getInfo: () => ipcRenderer.invoke('desktop:info'),
  readGitReadonlySnapshot: (rootPath) =>
    ipcRenderer.invoke('desktop:git-readonly-snapshot', { rootPath }),
  spawnNodeInspect: (payload) => ipcRenderer.invoke('desktop:spawn-node-inspect', payload),
  killNodeInspect: (sessionId) => ipcRenderer.invoke('desktop:kill-node-inspect', { sessionId }),
  onNodeInspectExit: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:node-inspect-exit', listener)
    return () => ipcRenderer.removeListener('desktop:node-inspect-exit', listener)
  },
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:update-status', listener)
    return () => ipcRenderer.removeListener('desktop:update-status', listener)
  },
  onProjectOpened: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:project-opened', listener)
    return () => ipcRenderer.removeListener('desktop:project-opened', listener)
  },
})
