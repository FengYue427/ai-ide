/**
 * IDE-4b-5 — electron-updater (packaged app only).
 * Portable: may prompt to download from GitHub Releases if in-place update fails.
 */
import { app, dialog, shell } from 'electron'
import fs from 'fs/promises'
import path from 'path'

const RELEASES_URL =
  process.env.AI_IDE_RELEASES_URL?.trim() ||
  'https://github.com/FengYue427/ai-ide/releases/latest'

let mainWindowRef = null
let updateCheckInFlight = false
let autoUpdater = null
let listenersBound = false

function isAutoUpdateEnabled() {
  if (!app.isPackaged) return false
  if (process.env.AI_IDE_AUTO_UPDATE === '0') return false
  return true
}

function isPortableWindows() {
  return process.platform === 'win32' && Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
}

function sendStatus(payload) {
  mainWindowRef?.webContents?.send('desktop:update-status', payload)
}

async function showDialog(type, title, message, buttons = ['OK']) {
  if (!mainWindowRef) return { response: 0 }
  return dialog.showMessageBox(mainWindowRef, { type, title, message, buttons, defaultId: 0 })
}

function openReleasesPage() {
  void shell.openExternal(RELEASES_URL)
}

async function getAutoUpdater() {
  if (autoUpdater) return autoUpdater
  const mod = await import('electron-updater')
  autoUpdater = mod.autoUpdater
  return autoUpdater
}

async function bindUpdaterListeners() {
  if (listenersBound) return
  const updater = await getAutoUpdater()
  listenersBound = true

  updater.autoDownload = true
  updater.autoInstallOnAppQuit = true
  updater.allowDowngrade = false

  updater.on('checking-for-update', () => {
    sendStatus({ phase: 'checking' })
  })

  updater.on('update-available', (info) => {
    sendStatus({ phase: 'available', version: info.version })
  })

  updater.on('update-not-available', (info) => {
    sendStatus({ phase: 'not-available', version: info?.version })
  })

  updater.on('error', (err) => {
    sendStatus({ phase: 'error', message: err?.message ?? String(err) })
    if (isPortableWindows()) {
      void showDialog(
        'info',
        'AI IDE — Update',
        `Could not apply an in-app update (${err?.message ?? 'unknown'}).\n\nOpen the releases page to download the latest portable build?`,
        ['Open releases', 'Later'],
      ).then((r) => {
        if (r.response === 0) openReleasesPage()
      })
    }
  })

  updater.on('download-progress', (p) => {
    sendStatus({
      phase: 'downloading',
      percent: p.percent,
      transferred: p.transferred,
      total: p.total,
    })
  })

  updater.on('update-downloaded', (info) => {
    sendStatus({ phase: 'downloaded', version: info.version })
    void showDialog(
      'info',
      'AI IDE — Update ready',
      `Version ${info.version} has been downloaded. Restart now to install?`,
      ['Restart now', 'Later'],
    ).then(async (r) => {
      if (r.response === 0) {
        if (isPortableWindows()) {
          openReleasesPage()
          return
        }
        const u = await getAutoUpdater()
        u.quitAndInstall(false, true)
      }
    })
  })
}

export function setupDesktopUpdater(getMainWindow) {
  mainWindowRef = getMainWindow()

  if (!isAutoUpdateEnabled()) return

  void bindUpdaterListeners()
  setTimeout(() => {
    void checkForUpdates(false)
  }, 12_000)
}

export async function checkForUpdates(manual = true) {
  if (!isAutoUpdateEnabled()) {
    if (manual) {
      await showDialog(
        'info',
        'AI IDE',
        'Updates are only checked in the packaged desktop app.\n\nOpen the releases page?',
        ['Open releases', 'Cancel'],
      ).then((r) => {
        if (r.response === 0) openReleasesPage()
      })
    }
    return { ok: false, reason: 'not-packaged' }
  }

  if (updateCheckInFlight) return { ok: false, reason: 'in-flight' }

  updateCheckInFlight = true
  try {
    await bindUpdaterListeners()
    const updater = await getAutoUpdater()
    const result = await updater.checkForUpdates()
    if (manual && !result?.updateInfo) {
      await showDialog('info', 'AI IDE', 'You are on the latest desktop build.')
    }
    return { ok: true, updateInfo: result?.updateInfo }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendStatus({ phase: 'error', message })
    if (manual) {
      await showDialog(
        'warning',
        'AI IDE — Update check failed',
        `${message}\n\nOpen the releases page to download manually?`,
        ['Open releases', 'Cancel'],
      ).then((r) => {
        if (r.response === 0) openReleasesPage()
      })
    }
    return { ok: false, error: message }
  } finally {
    updateCheckInFlight = false
  }
}

/** Append-only crash log in userData (shell-only; web UI uses Sentry when DSN set). */
export function installDesktopCrashLog() {
  const logPath = path.join(app.getPath('userData'), 'desktop-crash.log')

  const append = async (label, err) => {
    const line = `[${new Date().toISOString()}] ${label}: ${err?.stack ?? err?.message ?? String(err)}\n`
    try {
      await fs.appendFile(logPath, line, 'utf8')
    } catch {
      /* ignore */
    }
  }

  process.on('uncaughtException', (err) => {
    void append('uncaughtException', err)
  })
  process.on('unhandledRejection', (reason) => {
    void append('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)))
  })

  return logPath
}
