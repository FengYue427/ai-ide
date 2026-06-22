import { randomBytes } from 'node:crypto'
import { prisma } from '../../src/lib/prisma'
import type { ShareFilePayload } from './sharePayload'
import { getShareTtlMs } from '../billing/entitlements'

/** @deprecated Use getMaxSharesForPlan(planName) */
export const MAX_SHARES_PER_USER = 30

/** @deprecated Use getShareTtlMs(planName) */
export const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function generateShareSlug(): string {
  return randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 8)
}

export type ProjectShareRecord = {
  id: string
  slug: string
  userId: string | null
  files: ShareFilePayload[]
  expiresAt: Date
  createdAt: Date
}

function parseShareFiles(raw: string): ShareFilePayload[] {
  try {
    const parsed = JSON.parse(raw) as ShareFilePayload[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeProjectShare(row: {
  id: string
  slug: string
  userId: string | null
  files: string
  expiresAt: Date
  createdAt: Date
}): ProjectShareRecord {
  return {
    id: row.id,
    slug: row.slug,
    userId: row.userId,
    files: parseShareFiles(row.files),
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
}

export async function countUserProjectShares(userId: string): Promise<number> {
  return prisma.projectShare.count({
    where: { userId, expiresAt: { gt: new Date() } },
  })
}

export async function createProjectShare(
  userId: string | null,
  files: ShareFilePayload[],
  options?: { planName?: string },
): Promise<ProjectShareRecord> {
  const ttlMs = userId ? getShareTtlMs(options?.planName ?? 'free') : SHARE_TTL_MS
  const expiresAt = new Date(Date.now() + ttlMs)
  const filesJson = JSON.stringify(files)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = generateShareSlug()
    try {
      const row = await prisma.projectShare.create({
        data: { slug, userId, files: filesJson, expiresAt },
      })
      return serializeProjectShare(row)
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : ''
      if (code === 'P2002' && attempt < 4) continue
      throw error
    }
  }

  throw new Error('share_slug_conflict')
}

export async function getProjectShareBySlug(slug: string): Promise<ProjectShareRecord | null> {
  const normalized = slug.trim()
  if (!normalized) return null

  const row = await prisma.projectShare.findUnique({ where: { slug: normalized } })
  if (!row) return null
  if (row.expiresAt.getTime() <= Date.now()) return null
  return serializeProjectShare(row)
}

export async function listProjectSharesForUser(userId: string): Promise<ProjectShareRecord[]> {
  const rows = await prisma.projectShare.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: MAX_SHARES_PER_USER,
  })
  return rows.map(serializeProjectShare)
}

export async function deleteProjectShare(slug: string, userId: string): Promise<boolean> {
  const normalized = slug.trim()
  if (!normalized) return false

  const row = await prisma.projectShare.findUnique({ where: { slug: normalized } })
  if (!row || row.userId !== userId) return false

  await prisma.projectShare.delete({ where: { slug: normalized } })
  return true
}
