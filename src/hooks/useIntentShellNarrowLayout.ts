import { useNarrowViewport } from './useNarrowViewport'

/** Intent Shell 三栏在 ≤1100px 时切换为 Drawer（与 intent-shell.css 一致） */
export const INTENT_SHELL_NARROW_BREAKPOINT_PX = 1100

export function useIntentShellNarrowLayout(shellActive: boolean): boolean {
  const narrow = useNarrowViewport(INTENT_SHELL_NARROW_BREAKPOINT_PX)
  return shellActive && narrow
}
