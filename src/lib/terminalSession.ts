/** Shared terminal output buffer + xterm writer bridge (v1.1.5 F1, multi-session 1.1.5.4). */

import {
  appendToActiveSession,
  clearActiveSessionBuffer,
  getActiveSessionOutputLines,
} from './terminalSessionsManager'

export type TerminalWriter = {
  write: (data: string) => void
  clear: () => void
}

let writer: TerminalWriter | null = null

export function registerTerminalWriter(next: TerminalWriter | null): void {
  writer = next
}

export function appendTerminalOutput(data: string): void {
  appendToActiveSession(data)
  writer?.write(data)
}

export function clearTerminalOutput(): void {
  clearActiveSessionBuffer()
  writer?.clear()
}

export function getTerminalOutputLines(): string[] {
  return getActiveSessionOutputLines()
}

let shellInputWriter: ((data: string) => void) | null = null
let shellResizeHandler: ((cols: number, rows: number) => void) | null = null

export function registerShellInputWriter(next: ((data: string) => void) | null): void {
  shellInputWriter = next
}

export function registerShellResizeHandler(next: ((cols: number, rows: number) => void) | null): void {
  shellResizeHandler = next
}

export function resizeShell(cols: number, rows: number): void {
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) return
  shellResizeHandler?.(Math.max(1, Math.floor(cols)), Math.max(1, Math.floor(rows)))
}

export function sendShellInput(data: string): void {
  shellInputWriter?.(data)
}

export function isShellInputReady(): boolean {
  return shellInputWriter !== null
}
