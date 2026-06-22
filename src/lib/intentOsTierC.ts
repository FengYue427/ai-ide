/**
 * Tier C feature groundwork — flip individual flags as C1–C6 land.
 * Default: replay + share import parsing enabled; graph v2 / autopilot off.
 */
export const TIER_C_FLAGS = {
  /** C1 — restore queue + graph focus from proof report */
  intentReplay: true,
  /** C2 — import `.aide/meta/intent-share.json` */
  intentShareImport: true,
  /** C3 — drift resolution actions in shell bar */
  driftResolution: true,
  /** C4 — grounding gate v2 (deps / symbols) */
  groundingGateV2: true,
  /** C6 — plan autopilot lite */
  autopilotLite: true,
  /** C5 — interactive graph canvas */
  intentGraphV2: true,
} as const

export type TierCFlag = keyof typeof TIER_C_FLAGS

export function isTierCEnabled(flag: TierCFlag): boolean {
  return TIER_C_FLAGS[flag]
}
