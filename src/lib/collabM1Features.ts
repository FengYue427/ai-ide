/** v1.1.3 collaboration M1 — server-backed rooms (see VITE_COLLAB_M1_SIGNAL). */
export function isCollabM1Enabled(): boolean {
  return import.meta.env.VITE_COLLAB_M1_SIGNAL === 'true'
}
