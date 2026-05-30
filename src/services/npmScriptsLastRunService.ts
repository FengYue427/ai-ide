import {
  NPM_SCRIPTS_LAST_RUN_KEY,
  normalizeNpmScriptLastRun,
  type NpmScriptLastRun,
  type NpmScriptLastRunStatus,
} from '../lib/npmScriptRun'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

export async function loadNpmScriptsLastRun(): Promise<NpmScriptLastRun | null> {
  const stored = await unifiedStorage.get<unknown>(NPM_SCRIPTS_LAST_RUN_KEY, null)
  return normalizeNpmScriptLastRun(stored)
}

export async function persistNpmScriptsLastRun(
  name: string,
  status: NpmScriptLastRunStatus,
  exitCode?: number,
): Promise<NpmScriptLastRun> {
  const next: NpmScriptLastRun = {
    name,
    status,
    exitCode,
    ranAt: Date.now(),
  }
  await unifiedStorage.set(NPM_SCRIPTS_LAST_RUN_KEY, next, { layer: StorageLayer.LOCAL })
  return next
}

export async function clearNpmScriptsLastRun(): Promise<void> {
  await unifiedStorage.remove(NPM_SCRIPTS_LAST_RUN_KEY)
}
