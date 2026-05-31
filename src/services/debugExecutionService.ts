import type { DebugCdpClient } from './debugCdpClient'
import {
  clearCachedDebugCallStack,
  getActiveDebugClient,
  getCachedDebugCallStack,
} from './debugSessionService'

export type DebugStepCommand = 'Debugger.stepOver' | 'Debugger.stepInto' | 'Debugger.stepOut'

async function sendStepCommand(client: DebugCdpClient, method: DebugStepCommand): Promise<void> {
  const frameId = getCachedDebugCallStack()[0]?.id
  if (!frameId) {
    throw new Error('No active call frame')
  }
  clearCachedDebugCallStack()
  await client.send(method, { callFrameId: frameId })
}

export async function executeDebugContinue(): Promise<boolean> {
  const client = getActiveDebugClient()
  if (!client) return false
  clearCachedDebugCallStack()
  await client.send('Debugger.resume')
  return true
}

export async function executeDebugStepOver(): Promise<boolean> {
  const client = getActiveDebugClient()
  if (!client) return false
  await sendStepCommand(client, 'Debugger.stepOver')
  return true
}

export async function executeDebugStepInto(): Promise<boolean> {
  const client = getActiveDebugClient()
  if (!client) return false
  await sendStepCommand(client, 'Debugger.stepInto')
  return true
}

export async function executeDebugStepOut(): Promise<boolean> {
  const client = getActiveDebugClient()
  if (!client) return false
  await sendStepCommand(client, 'Debugger.stepOut')
  return true
}
