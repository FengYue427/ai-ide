/**
 * Debug session abstraction (DAP-inspired, CDP-backed).
 * See docs/ADR_V1.2_DAP.md
 */
import type { DebugBreakpoint } from '../debugBreakpoints'

export type DebugSessionPhase = 'idle' | 'connecting' | 'running' | 'paused' | 'ended'

export interface DebugSourceLocation {
  path: string
  line: number
  column?: number
}

export interface DebugStackFrame {
  id: number
  name: string
  location: DebugSourceLocation
}

export interface DebugVariableNode {
  name: string
  value: string
  type?: string
  children?: DebugVariableNode[]
}

export interface DebugPauseState {
  location: DebugSourceLocation
  callStack: DebugStackFrame[]
  locals: DebugVariableNode[]
}

export interface DebugSessionEvents {
  onPaused?: (state: DebugPauseState) => void
  onResumed?: () => void
  onEnded?: () => void
  onDisconnect?: () => void
}

/** Runtime-agnostic debug session (CDP implementation in services/debug). */
export interface DebugSession {
  readonly kind: 'cdp' | 'injection'
  connect(inspectUrl: string, breakpoints: DebugBreakpoint[]): Promise<{ registered: number }>
  setBreakpoints(breakpoints: DebugBreakpoint[]): Promise<number>
  resume(): Promise<void>
  stepOver(): Promise<void>
  stepIn(): Promise<void>
  stepOut(): Promise<void>
  evaluate(expression: string, frameId?: number): Promise<string | null>
  disconnect(): void
  setEvents(events: DebugSessionEvents): void
}
