/**
 * Desktop (Electron) vs browser capability matrix — single source for UI hints and guards.
 */
import { isDesktopApp } from '../services/desktopBridge'
import { getElectronRootPath } from '../services/localProjectService'

export type PlatformSurface = 'desktop' | 'browser'

export type PlatformCapability =
  | 'nativeFolder'
  | 'nativePty'
  | 'nativeGitReadonly'
  | 'nativeNodeInspect'
  | 'webContainerRun'
  | 'runtimeShellHooks'
  | 'fileSystemAccessPicker'

export interface PlatformCapabilityRow {
  id: PlatformCapability
  desktop: boolean | 'partial'
  browser: boolean | 'partial'
  noteKey?: string
}

/** Ordered capability matrix for settings / about surfaces. */
export const PLATFORM_CAPABILITY_MATRIX: PlatformCapabilityRow[] = [
  {
    id: 'nativeFolder',
    desktop: true,
    browser: 'partial',
    noteKey: 'platform.capability.nativeFolder',
  },
  {
    id: 'nativePty',
    desktop: true,
    browser: false,
    noteKey: 'platform.capability.nativePty',
  },
  {
    id: 'nativeGitReadonly',
    desktop: true,
    browser: false,
    noteKey: 'platform.capability.nativeGitReadonly',
  },
  {
    id: 'nativeNodeInspect',
    desktop: true,
    browser: 'partial',
    noteKey: 'platform.capability.nativeNodeInspect',
  },
  {
    id: 'webContainerRun',
    desktop: 'partial',
    browser: true,
    noteKey: 'platform.capability.webContainerRun',
  },
  {
    id: 'runtimeShellHooks',
    desktop: true,
    browser: false,
    noteKey: 'platform.capability.runtimeShellHooks',
  },
  {
    id: 'fileSystemAccessPicker',
    desktop: true,
    browser: 'partial',
    noteKey: 'platform.capability.fileSystemAccessPicker',
  },
]

export function getPlatformSurface(): PlatformSurface {
  return isDesktopApp() ? 'desktop' : 'browser'
}

export function hasNativeProjectRoot(): boolean {
  return isDesktopApp() && Boolean(getElectronRootPath()?.trim())
}

/** Runtime pill: desktop folder bound, or WebContainer ready in browser. */
export function isRuntimeEnvironmentReady(webContainerReady: boolean): boolean {
  if (hasNativeProjectRoot()) return true
  return webContainerReady
}

export function supportsCapability(id: PlatformCapability): boolean {
  const row = PLATFORM_CAPABILITY_MATRIX.find((entry) => entry.id === id)
  if (!row) return false
  const surface = getPlatformSurface()
  const value = surface === 'desktop' ? row.desktop : row.browser
  return value === true
}

export type RuntimeStatusKind = 'desktopReady' | 'webReady' | 'loading' | 'desktopIdle'

export function resolveRuntimeStatusKind(webContainerReady: boolean): RuntimeStatusKind {
  if (hasNativeProjectRoot()) return 'desktopReady'
  if (webContainerReady) return 'webReady'
  if (isDesktopApp()) return 'desktopIdle'
  return 'loading'
}
