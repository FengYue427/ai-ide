import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../src/lib/prisma'
import {
  ensurePlansSeeded,
  getUserSubscription,
  upsertUserSubscription,
} from '../lib/billing/subscriptionDb'

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

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 ? process.argv[idx + 1]?.trim() : undefined
}

const email = arg('email')
const phone = arg('phone')
const plan = arg('plan') ?? 'enterprise'

if (!email && !phone) {
  console.error(
    'Usage: npx tsx scripts/restore-user-subscription.ts --email <email> [--plan enterprise]',
  )
  console.error('   or: npx tsx scripts/restore-user-subscription.ts --phone <digits> [--plan enterprise]')
  process.exit(1)
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('❌ DATABASE_URL is required (.env.local)')
  process.exit(1)
}

let user = email
  ? await prisma.user.findUnique({ where: { email } })
  : await prisma.user.findFirst({
      where: {
        OR: [{ email: { contains: phone! } }, { name: { contains: phone! } }],
      },
    })

if (!user) {
  console.error('❌ User not found')
  process.exit(1)
}

await ensurePlansSeeded()
const before = await getUserSubscription(user.id)
const subscription = await upsertUserSubscription(user.id, plan)

console.log('✅ Subscription restored')
console.log('User:', user.email, user.id)
console.log(
  'Before:',
  before ? `${before.plan.name} until ${before.currentPeriodEnd.toISOString()}` : 'none',
)
console.log('After:', subscription.plan.name, 'until', subscription.currentPeriodEnd.toISOString())

await prisma.$disconnect()
