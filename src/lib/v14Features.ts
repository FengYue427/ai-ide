/** v1.4 — feature flags. See docs/V1.4_ENV.md */

import { isDesktopApp } from '../services/desktopBridge'

const TAB_FIM_PRODUCTION_LS = 'ai-ide:feature:tabFimProduction'
const INDEX_2K_PRODUCTION_LS = 'ai-ide:feature:index2kProduction'
const DESKTOP_SHELL_PRODUCTION_LS = 'ai-ide:feature:desktopShellProduction'
const BACKGROUND_AGENT_PRODUCTION_LS = 'ai-ide:feature:backgroundAgentProduction'
const MCP_PLUGIN_PRODUCTION_LS = 'ai-ide:feature:mcpPluginProduction'

function readLocalFeatureFlag(key: string): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function isDevRuntime(): boolean {
  return import.meta.env.DEV && import.meta.env.MODE !== 'test'
}

function readEnvFlag(name: string, sessionKey: string): boolean {
  const raw = import.meta.env[name]
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (isDevRuntime()) return true
  return readLocalFeatureFlag(sessionKey)
}

export interface V14FeatureStatus {
  tabFimProduction: boolean
  index2kProduction: boolean
  gitHunkStage: boolean
  desktopShellProduction: boolean
  backgroundAgentProduction: boolean
  mcpPluginProduction: boolean
}

export function getV14FeatureStatus(): V14FeatureStatus {
  return {
    tabFimProduction: isTabFimProductionEnabled(),
    index2kProduction: isIndex2kProductionEnabled(),
    gitHunkStage: isGitHunkStageEnabled(),
    desktopShellProduction: isDesktopShellProductionEnabled(),
    backgroundAgentProduction: isBackgroundAgentProductionEnabled(),
    mcpPluginProduction: isMcpPluginProductionEnabled(),
  }
}

/** Production Tab/FIM defaults: force-enabled tab completion + optimized debounce. */
export function isTabFimProductionEnabled(): boolean {
  return readEnvFlag('VITE_TAB_FIM_PRODUCTION', TAB_FIM_PRODUCTION_LS)
}

export function enableTabFimProductionForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(TAB_FIM_PRODUCTION_LS, '1')
}

/** F2: 2k cap + worker-friendly index builds in production. */
export function isIndex2kProductionEnabled(): boolean {
  return readEnvFlag('VITE_INDEX_2K_PRODUCTION', INDEX_2K_PRODUCTION_LS)
}

export function enableIndex2kProductionForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(INDEX_2K_PRODUCTION_LS, '1')
}

/** F2: lower worker threshold when production index policy is on. */
export function getIndexWorkerMinSources(): number {
  return isIndex2kProductionEnabled() ? 40 : 80
}

/** F3: Git hunk stage panel (v1.4 GA default on; opt-out via env). */
export function isGitHunkStageEnabled(): boolean {
  return import.meta.env.VITE_GIT_HUNK_STAGE !== 'false'
}

/** F4: desktop shell auto-restore + local-dist defaults. */
export function isDesktopShellProductionEnabled(): boolean {
  if (!isDesktopApp()) return false
  return readEnvFlag('VITE_DESKTOP_SHELL_PRODUCTION', DESKTOP_SHELL_PRODUCTION_LS)
}

export function enableDesktopShellProductionForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(DESKTOP_SHELL_PRODUCTION_LS, '1')
}

/** F5: background Agent client visible when production policy is on. */
export function isBackgroundAgentProductionEnabled(): boolean {
  return readEnvFlag('VITE_BACKGROUND_AGENT_PRODUCTION', BACKGROUND_AGENT_PRODUCTION_LS)
}

export function enableBackgroundAgentProductionForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(BACKGROUND_AGENT_PRODUCTION_LS, '1')
}

/** F6: MCP/插件生产目录与 payload 预留策略。 */
export function isMcpPluginProductionEnabled(): boolean {
  return readEnvFlag('VITE_MCP_PLUGIN_PRODUCTION', MCP_PLUGIN_PRODUCTION_LS)
}

export function enableMcpPluginProductionForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(MCP_PLUGIN_PRODUCTION_LS, '1')
}
