import { prisma } from '../../src/lib/prisma'
import type { PluginPublishReviewRecord } from './pluginPublishQueue'

export type PluginPublishReviewRow = {
  reviewId: string
  status: 'pending'
  pluginId: string
  version: string
  manifestHash: string
  submittedAt: string
}

function toRow(record: {
  reviewId: string
  status: string
  pluginId: string
  version: string
  manifestHash: string
  submittedAt: Date
}): PluginPublishReviewRow {
  return {
    reviewId: record.reviewId,
    status: record.status === 'pending' ? 'pending' : 'pending',
    pluginId: record.pluginId,
    version: record.version,
    manifestHash: record.manifestHash,
    submittedAt: record.submittedAt.toISOString(),
  }
}

export async function persistPluginPublishReview(record: PluginPublishReviewRecord): Promise<boolean> {
  try {
    await prisma.pluginPublishReview.create({
      data: {
        reviewId: record.reviewId,
        userId: record.submitterUserId,
        pluginId: record.pluginId,
        version: record.version,
        manifestHash: record.manifestHash,
        status: record.status,
        submittedAt: new Date(record.submittedAt),
      },
    })
    return true
  } catch (error) {
    console.warn('[PluginPublishDb] persist failed (memory queue still holds row)', error)
    return false
  }
}

export async function listPluginPublishReviewsFromDb(
  userId: string,
  limit = 10,
  status?: 'pending',
): Promise<PluginPublishReviewRow[] | null> {
  try {
    const rows = await prisma.pluginPublishReview.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    })
    return rows.map(toRow)
  } catch (error) {
    console.warn('[PluginPublishDb] list failed', error)
    return null
  }
}

export async function findPluginPublishReviewForUser(
  userId: string,
  reviewId: string,
): Promise<PluginPublishReviewRow | null> {
  try {
    const row = await prisma.pluginPublishReview.findFirst({
      where: { userId, reviewId },
    })
    return row ? toRow(row) : null
  } catch (error) {
    console.warn('[PluginPublishDb] find failed', error)
    return null
  }
}

export async function findPluginPublishReviewInDb(reviewId: string): Promise<boolean> {
  try {
    const row = await prisma.pluginPublishReview.findUnique({ where: { reviewId } })
    return Boolean(row)
  } catch {
    return false
  }
}
