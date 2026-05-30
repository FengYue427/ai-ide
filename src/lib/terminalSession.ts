/** Shared terminal output buffer + xterm writer bridge (v1.1.5 F1). */

export type TerminalWriter = {
  write: (data: string) => void
  clear: () => void
}

const MAX_BUFFER_LINES = 2000

let writer: TerminalWriter | null = null
const outputLines: string[] = []
let pendingChunks = ''

export function registerTerminalWriter(next: TerminalWriter | null): void {
  writer = next
}

export function appendTerminalOutput(data: string): void {
  if (!data) return

  pendingChunks += data
  const parts = pendingChunks.split(/\r?\n/)
  pendingChunks = parts.pop() ?? ''
  for (const part of parts) {
    if (part.length > 0) outputLines.push(part)
  }
  if (outputLines.length > MAX_BUFFER_LINES) {
    outputLines.splice(0, outputLines.length - MAX_BUFFER_LINES)
  }

  writer?.write(data)
}

export function clearTerminalOutput(): void {
  outputLines.length = 0
  pendingChunks = ''
  writer?.clear()
}

export function getTerminalOutputLines(): string[] {
  const tail = pendingChunks.trim()
  return tail ? [...outputLines, tail] : [...outputLines]
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
