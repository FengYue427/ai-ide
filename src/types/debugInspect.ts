export interface DebugStackFrame {
  id: string
  functionName: string
  path: string
  line: number
  column: number
  localScopeObjectId?: string
}

export interface DebugLocalVariable {
  name: string
  valuePreview: string
  type: string
}

export interface DebugPauseInspection {
  location: { path: string; line: number }
  callStack: DebugStackFrame[]
  locals: DebugLocalVariable[]
}
