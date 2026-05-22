import type { UserWorkspace } from '@prisma/client'
import { prismaUpsert, type UpsertDelegate } from '../billing/prismaUpsert'
import { prisma } from '../../src/lib/prisma'

export function serializeWorkspace(workspace: {
  id: string
  name: string
  files: string
  settings: string | null
  isDefault: boolean
  updatedAt: Date
}) {
  return {
    id: workspace.name,
    dbId: workspace.id,
    name: workspace.name,
    files: workspace.files,
    settings: workspace.settings ?? '{}',
    isDefault: workspace.isDefault,
    updatedAt: workspace.updatedAt.toISOString(),
  }
}

export async function countUserWorkspaces(userId: string): Promise<number> {
  return prisma.userWorkspace.count({ where: { userId } })
}

export async function listUserWorkspaces(userId: string) {
  const rows = await prisma.userWorkspace.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  })
  return rows.map((row) => ({
    id: row.name,
    dbId: row.id,
    name: row.name,
    isDefault: row.isDefault,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getWorkspaceByName(userId: string, name: string) {
  return prisma.userWorkspace.findUnique({
    where: { userId_name: { userId, name } },
  })
}

export async function ensureDefaultWorkspace(userId: string) {
  const existing = await getWorkspaceByName(userId, 'default')
  if (existing) return existing

  return prisma.userWorkspace.create({
    data: {
      userId,
      name: 'default',
      files: '[]',
      settings: '{}',
      isDefault: true,
    },
  })
}

export async function upsertWorkspace(
  userId: string,
  name: string,
  files: string,
  settings: string | null,
) {
  const isDefault = name === 'default'

  return prismaUpsert<UserWorkspace>({
    delegate: prisma.userWorkspace as unknown as UpsertDelegate<UserWorkspace>,
    where: { userId_name: { userId, name } },
    create: {
      userId,
      name,
      files,
      settings: settings ?? '{}',
      isDefault,
    },
    update: {
      files,
      settings: settings ?? '{}',
      isDefault,
    },
  })
}

export async function deleteWorkspaceByName(userId: string, name: string) {
  if (name === 'default') {
    throw new Error('DEFAULT_WORKSPACE_PROTECTED')
  }

  await prisma.userWorkspace.delete({
    where: { userId_name: { userId, name } },
  })
}
