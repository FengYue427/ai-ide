import { collabRoleCanWrite } from './collabPermissions'

/** Collaboration viewers cannot start or control debug sessions (v1.1.7 F6). */
export function isCollaborationDebugBlocked(
  roomId: string | null | undefined,
  role: string | null | undefined,
): boolean {
  return Boolean(roomId && !collabRoleCanWrite(role))
}
