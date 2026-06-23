/**
 * IDE-4b Electron shell — dev server, offline dist, or production remote (packaged default).
 */
import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell } from 'electron'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import {
  DESKTOP_MAX_IMPORT_FILES,
  readProjectFile,
  scanProjectFolder,
  writeProjectFile,
} from './fsProject.mjs'
import {
  getPtyCapabilities,
  killAllPtySessions,
  killPtySession,
  resizePtySession,
  spawnPtySession,
  writePtySession,
} from './ptyBridge.mjs'
import { checkForUpdates, installDesktopCrashLog, setupDesktopUpdater } from './updater.mjs'
import { readGitReadonlySnapshot, readGitOriginRemote, syncGitOrigin } from './gitCli.mjs'
import {
  killNodeInspectSession,
  spawnNodeInspectSession,
  validateInspectEntry,
} from './nodeInspect.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DESKTOP_DEEP_LINK_SCHEME = 'ai-ide'
const PRODUCTION_APP_URL =
  process.env.AI_IDE_APP_URL?.trim() || 'https://ai-ide-flame.vercel.app'
const LAST_PROJECT_FILE = () => path.join(app.getPath('userData'), 'last-desktop-project.json')

let mainWindow = null
let projectRoot = null
let lastTerminalOutput = ''
let shellMode = 'remote'
/** @type {{ kind: 'oauth' | 'billing'; params: Record<string, string> } | null} */
let pendingDeepLink = null

function parseDeepLinkArg(argv) {
  return argv.find((arg) => typeof arg === 'string' && arg.startsWith(`${DESKTOP_DEEP_LINK_SCHEME}://`))
}

function dispatchDeepLink(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== `${DESKTOP_DEEP_LINK_SCHEME}:`) return
    const params = {}
    parsed.searchParams.forEach((value, key) => {
      params[key] = value
    })
    const kind = params.kind === 'billing' ? 'billing' : 'oauth'
    const payload = { kind, params }
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('desktop:deep-link', payload)
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      pendingDeepLink = payload
    }
  } catch {
    // ignore malformed deep links
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const link = parseDeepLinkArg(argv)
    if (link) dispatchDeepLink(link)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  if (url.startsWith(`${DESKTOP_DEEP_LINK_SCHEME}://`)) dispatchDeepLink(url)
})

function devServerUrl() {
  return process.env.ELECTRON_VITE_DEV_SERVER_URL?.trim() || 'http://127.0.0.1:3000'
}

function localDistIndexUrl() {
  const root = path.join(__dirname, '..')
  const uiDir = existsSync(path.join(root, 'dist-electron-ui', 'index.html'))
    ? 'dist-electron-ui'
    : 'dist'
  const indexHtml = path.join(root, uiDir, 'index.html')
  return pathToFileURL(indexHtml).href
}

function resolveShellMode() {
  if (process.env.ELECTRON_VITE_DEV_SERVER_URL) return 'local-dev'
  if (process.env.AI_IDE_DESKTOP_OFFLINE === '1') return 'local-dist'
  if (process.env.AI_IDE_DESKTOP_REMOTE === '1') return 'remote'
  if (!app.isPackaged) return process.env.ELECTRON_USE_DIST === '1' ? 'local-dist' : 'local-dev'
  // Packaged default: local UI (avoids loading vercel.app in China); API via VITE_API_BASE_URL / AI_IDE_APP_URL
  return 'local-dist'
}

function resolveLoadTarget(mode) {
  if (mode === 'local-dev') return devServerUrl()
  if (mode === 'local-dist') return localDistIndexUrl()
  return PRODUCTION_APP_URL
}

async function loadUrl(target) {
  if (!mainWindow) return
  await mainWindow.loadURL(target)
}

function mapScanResult(scanned) {
  return {
    rootPath: scanned.rootPath,
    rootName: scanned.rootName,
    imported: scanned.imported,
    skipped: scanned.skipped,
    capped: scanned.capped,
    errors: scanned.errors,
    entries: scanned.entries.map((e) => ({
      path: e.path,
      content: e.content,
      language: detectLanguage(e.path),
      size: e.size,
    })),
  }
}

async function pickAndScanFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  projectRoot = result.filePaths[0]
  const scanned = await scanProjectFolder(projectRoot)
  await saveLastProject(projectRoot, scanned.rootName)
  const payload = mapScanResult(scanned)
  mainWindow?.webContents.send('desktop:project-opened', payload)
  return payload
}

function createWindow() {
  shellMode = resolveShellMode()
  const target = resolveLoadTarget(shellMode)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'AI IDE',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  void loadUrl(target)

  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      mainWindow.webContents.send('desktop:deep-link', pendingDeepLink)
      pendingDeepLink = null
    }
  })

  if (shellMode === 'local-dev') {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

/** COOP/COEP for WebContainer (dev + offline dist). */
function patchSessionHeaders(mode) {
  if (mode === 'remote') return
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = {
      ...details.responseHeaders,
      'Cross-Origin-Embedder-Policy': ['require-corp'],
      'Cross-Origin-Opener-Policy': ['same-origin'],
    }
    callback({ responseHeaders: headers })
  })
}

function buildAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            void pickAndScanFolder()
          },
        },
        { type: 'separator' },
        {
          label: 'Open in Browser',
          click: () => shell.openExternal(PRODUCTION_APP_URL),
        },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            void checkForUpdates(true)
          },
        },
        {
          label: 'Release Notes',
          click: () => shell.openExternal('https://github.com/FengYue427/ai-ide/releases'),
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

async function saveLastProject(rootPath, rootName) {
  await fs.writeFile(
    LAST_PROJECT_FILE(),
    JSON.stringify({ rootPath, rootName, savedAt: Date.now() }),
    'utf8',
  )
}

async function loadLastProject() {
  try {
    const raw = await fs.readFile(LAST_PROJECT_FILE(), 'utf8')
    const data = JSON.parse(raw)
    if (data?.rootPath && typeof data.rootPath === 'string') {
      const st = await fs.stat(data.rootPath)
      if (st.isDirectory()) return data
    }
  } catch {
    /* none */
  }
  return null
}

function detectLanguage(relPath) {
  const ext = relPath.split('.').pop()?.toLowerCase() ?? ''
  const map = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    py: 'python',
    rs: 'rust',
    go: 'go',
  }
  return map[ext] ?? 'plaintext'
}

function registerIpc() {
  ipcMain.handle('desktop:shell-mode', () => ({
    mode: shellMode,
    appUrl: shellMode === 'remote' ? PRODUCTION_APP_URL : undefined,
  }))

  ipcMain.handle('desktop:info', async () => {
    const pty = await getPtyCapabilities()
    return {
    version: app.getVersion(),
    platform: process.platform,
    maxImportFiles: DESKTOP_MAX_IMPORT_FILES,
    shellMode,
    packaged: app.isPackaged,
    autoUpdate: app.isPackaged && process.env.AI_IDE_AUTO_UPDATE !== '0',
    ptyAvailable: pty.available,
    ptyReason: pty.reason,
  }
  })

  ipcMain.handle('desktop:pty-capabilities', async () => getPtyCapabilities())

  ipcMain.handle('desktop:pty-spawn', async (_e, { sessionId, cwd, cols, rows }) => {
    const id = String(sessionId ?? 'main')
    return spawnPtySession({
      sessionId: id,
      cwd: cwd || projectRoot || process.cwd(),
      cols,
      rows,
      onData: (data) => {
        mainWindow?.webContents.send('desktop:pty-data', { sessionId: id, data })
      },
      onExit: (exitCode) => {
        mainWindow?.webContents.send('desktop:pty-exit', { sessionId: id, exitCode })
      },
    })
  })

  ipcMain.handle('desktop:pty-write', async (_e, { sessionId, data }) => {
    return { ok: writePtySession(String(sessionId ?? 'main'), String(data ?? '')) }
  })

  ipcMain.handle('desktop:pty-resize', async (_e, { sessionId, cols, rows }) => {
    return { ok: resizePtySession(String(sessionId ?? 'main'), cols, rows) }
  })

  ipcMain.handle('desktop:pty-kill', async (_e, { sessionId }) => {
    killPtySession(String(sessionId ?? 'main'))
    return { ok: true }
  })

  ipcMain.handle('desktop:check-updates', async () => checkForUpdates(true))

  ipcMain.handle('desktop:open-external', async (_e, { url }) => {
    const target = String(url ?? '').trim()
    if (!/^https?:\/\//i.test(target)) return { ok: false, reason: 'invalid_url' }
    await shell.openExternal(target)
    return { ok: true }
  })

  ipcMain.handle('desktop:reload-local-shell', async () => {
    if (shellMode === 'remote') return { ok: false, reason: 'remote_shell' }
    const target =
      shellMode === 'local-dev' ? devServerUrl() : localDistIndexUrl()
    await loadUrl(target)
    return { ok: true, mode: shellMode }
  })

  ipcMain.handle('desktop:pick-folder', async () => {
    const payload = await pickAndScanFolder()
    return payload
  })

  ipcMain.handle('desktop:restore-last', async () => {
    const last = await loadLastProject()
    if (!last) return null
    projectRoot = last.rootPath
    const scanned = await scanProjectFolder(projectRoot)
    const payload = mapScanResult(scanned)
    mainWindow?.webContents.send('desktop:project-opened', payload)
    return payload
  })

  ipcMain.handle('desktop:scan-project', async (_e, rootPath) => {
    projectRoot = rootPath
    const scanned = await scanProjectFolder(rootPath)
    return mapScanResult(scanned)
  })

  ipcMain.handle('desktop:read-file', async (_e, { rootPath, relPath, startLine, endLine }) => {
    return readProjectFile(rootPath ?? projectRoot, relPath, startLine, endLine)
  })

  ipcMain.handle('desktop:write-file', async (_e, { rootPath, relPath, content }) => {
    const root = rootPath ?? projectRoot
    if (!root) throw new Error('LOCAL_PROJECT_NOT_BOUND')
    await writeProjectFile(root, relPath, content)
    return { ok: true }
  })

  ipcMain.handle('desktop:git-readonly-snapshot', async (_e, { rootPath }) => {
    const root = rootPath ?? projectRoot
    if (!root) return { ok: false, reason: 'NO_ROOT' }
    return readGitReadonlySnapshot(root)
  })

  ipcMain.handle('desktop:git-origin-remote', async (_e, { rootPath }) => {
    const root = rootPath ?? projectRoot
    if (!root) return { ok: false, reason: 'NO_ROOT' }
    return readGitOriginRemote(root)
  })

  ipcMain.handle('desktop:git-sync-origin', async (_e, { rootPath, action }) => {
    const root = rootPath ?? projectRoot
    if (!root) return { ok: false, reason: 'NO_ROOT' }
    if (action !== 'pull' && action !== 'push') return { ok: false, reason: 'INVALID_ACTION' }
    return syncGitOrigin(root, action)
  })

  ipcMain.handle('desktop:spawn-node-inspect', async (_e, { rootPath, entryFile }) => {
    const root = rootPath ?? projectRoot
    if (!root) return { ok: false, reason: 'NO_ROOT' }
    const valid = await validateInspectEntry(root, entryFile ?? 'index.js')
    if (!valid.ok) return valid
    return spawnNodeInspectSession({
      rootPath: root,
      entryFile: valid.entryFile,
      onExit: (sessionId, exitCode) => {
        mainWindow?.webContents.send('desktop:node-inspect-exit', { sessionId, exitCode })
      },
    })
  })

  ipcMain.handle('desktop:kill-node-inspect', async (_e, { sessionId }) => {
    if (!sessionId) return { ok: false }
    return { ok: killNodeInspectSession(sessionId) }
  })

  ipcMain.handle('desktop:run-command', async (_e, { rootPath, commandLine }) => {
    const cwd = rootPath ?? projectRoot ?? process.cwd()
    const line = String(commandLine ?? '').trim()
    if (!line) return { exitCode: 0, output: '' }

    return new Promise((resolve) => {
      const child = spawn(line, [], {
        cwd,
        shell: true,
        env: process.env,
        windowsHide: true,
      })
      let output = ''
      child.stdout?.on('data', (d) => {
        output += d.toString()
      })
      child.stderr?.on('data', (d) => {
        output += d.toString()
      })
      child.on('close', (code) => {
        lastTerminalOutput = output
        resolve({ exitCode: code ?? 0, output: output.trim() })
      })
      child.on('error', (err) => {
        lastTerminalOutput = err.message
        resolve({ exitCode: 1, output: err.message })
      })
    })
  })
}

app.whenReady().then(() => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(DESKTOP_DEEP_LINK_SCHEME, process.execPath, [
        path.resolve(process.argv[1]),
      ])
    }
  } else {
    app.setAsDefaultProtocolClient(DESKTOP_DEEP_LINK_SCHEME)
  }

  const startupLink = parseDeepLinkArg(process.argv)
  if (startupLink) {
    try {
      const parsed = new URL(startupLink)
      const params = {}
      parsed.searchParams.forEach((value, key) => {
        params[key] = value
      })
      pendingDeepLink = {
        kind: params.kind === 'billing' ? 'billing' : 'oauth',
        params,
      }
    } catch {
      pendingDeepLink = null
    }
  }

  installDesktopCrashLog()
  shellMode = resolveShellMode()
  patchSessionHeaders(shellMode)
  buildAppMenu()
  registerIpc()
  createWindow()
  setupDesktopUpdater(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  killAllPtySessions()
  if (process.platform !== 'darwin') app.quit()
})
