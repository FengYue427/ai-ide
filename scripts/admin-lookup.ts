/**
 * Support lookup: user profile, subscription, today's AI usage, cloud workspaces.
 *
 * Usage:
 *   npx tsx scripts/admin-lookup.ts user@example.com
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../src/lib/prisma'

const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: npx tsx scripts/admin-lookup.ts <email>')
  process.exit(1)
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL is not set (use .env.local or export it)')
  process.exit(1)
}

const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)

const user = await prisma.user.findUnique({
  where: { email },
  include: {
    subscription: { include: { plan: true } },
    workspaces: {
      select: { id: true, name: true, isDefault: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    },
  },
})

if (!user) {
  console.log(`No user found for ${email}`)
  process.exit(0)
}

const usageToday = await prisma.usageRecord.aggregate({
  where: {
    userId: user.id,
    type: 'ai_request',
    createdAt: { gte: startOfDay },
  },
  _sum: { amount: true },
})

const sub = user.subscription
console.log(JSON.stringify(
  {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    subscription: sub
      ? {
          plan: sub.plan.name,
          displayName: sub.plan.displayName,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
        }
      : null,
    usageTodayAiRequests: usageToday._sum.amount ?? 0,
    workspaces: user.workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      isDefault: w.isDefault,
      updatedAt: w.updatedAt.toISOString(),
    })),
  },
  null,
  2,
))

await prisma.$disconnect()
