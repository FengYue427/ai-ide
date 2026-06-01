import { isDesktopApp } from './desktopBridge'
import { getElectronRootPath } from './localProjectService'

/** Desktop folder is open in Electron — prefer native `node --inspect-brk` (v1.1.7.2). */
export function canUseDesktopDebug(): boolean {
  return isDesktopApp() && Boolean(getElectronRootPath())
}
