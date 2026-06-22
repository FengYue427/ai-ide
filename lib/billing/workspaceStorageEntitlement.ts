import { getStorageEntitlementLimitGb } from './entitlements'
import { prisma } from '../../src/lib/prisma'

const BYTES_PER_GB = 1024 * 1024 * 1024

export function getStorageLimitBytes(planName: string): number {
  return getStorageEntitlementLimitGb(planName) * BYTES_PER_GB
}

export function estimateWorkspacePayloadBytes(filesPayload: string, settingsPayload: string): number {
  return Buffer.byteLength(filesPayload, 'utf8') + Buffer.byteLength(settingsPayload, 'utf8')
}

export async function getUserCloudStorageBytes(userId: string): Promise<number> {
  const rows = await prisma.userWorkspace.findMany({
    where: { userId },
    select: { files: true, settings: true },
  })
  let total = 0
  for (const row of rows) {
    total += estimateWorkspacePayloadBytes(row.files ?? '[]', row.settings ?? '{}')
  }
  return total
}

export async function assertCloudStorageWithinLimit(
  userId: string,
  planName: string,
  nextPayloadBytes: number,
  options?: { replacingWorkspaceName?: string },
): Promise<{ ok: true } | { ok: false; used: number; limit: number; limitGb: number }> {
  const limit = getStorageLimitBytes(planName)
  const limitGb = getStorageEntitlementLimitGb(planName)
  let used = await getUserCloudStorageBytes(userId)

  if (options?.replacingWorkspaceName) {
    const existing = await prisma.userWorkspace.findUnique({
      where: { userId_name: { userId, name: options.replacingWorkspaceName } },
      select: { files: true, settings: true },
    })
    if (existing) {
      used -= estimateWorkspacePayloadBytes(existing.files ?? '[]', existing.settings ?? '{}')
    }
  }

  const projected = used + nextPayloadBytes
  if (projected > limit) {
    return { ok: false, used: projected, limit, limitGb }
  }
  return { ok: true }
}
