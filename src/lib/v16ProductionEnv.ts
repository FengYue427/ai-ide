/** v1.6.0 — production deploy env catalog. See docs/V1.6_ENV.md */

import { V15_PRODUCTION_SERVER_FLAGS, V15_PRODUCTION_VITE_FLAGS } from './v15ProductionEnv'

export const V16_PRODUCTION_VITE_FLAGS = V15_PRODUCTION_VITE_FLAGS

export const V16_PRODUCTION_SERVER_FLAGS = [
  ...V15_PRODUCTION_SERVER_FLAGS,
  {
    name: 'PLATFORM_DEEPSEEK_API_KEY',
    required: true,
    hint: 'Platform AI chat gateway (DeepSeek)',
  },
  {
    name: 'BILLING_CRON_SECRET',
    required: true,
    hint: 'Vercel cron auth for expire-subscriptions (or CRON_SECRET)',
  },
] as const
