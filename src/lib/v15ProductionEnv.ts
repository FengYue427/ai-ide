/** v1.5.1 — production deploy env catalog. See docs/V1.5_ENV.md */

export const V15_PRODUCTION_VITE_FLAGS = [
  { name: 'VITE_AI_GATEWAY', required: true, hint: 'Platform AI gateway (login users)' },
  { name: 'VITE_ALLOW_BYOK_LEGACY', required: false, mustBe: 'false', hint: 'Keep BYOK legacy off' },
  { name: 'VITE_TAB_PLUS_PLUS', required: true, hint: 'Tab++ multiline ghost + FIM' },
  { name: 'VITE_AIDE_SPEC_ARTIFACTS_V2', required: true, hint: 'Spec hooks.yaml catalog' },
  { name: 'VITE_AIDE_RUNTIME', required: true, hint: 'Runtime orchestrator + hookRunner' },
  { name: 'VITE_AIDE_ACTIVITY_LINE', required: true, hint: 'Activity Line production UI' },
] as const

/** Server-side keys recommended alongside v1.5 client flags. */
export const V15_PRODUCTION_SERVER_FLAGS = [
  { name: 'APP_URL', required: true, hint: 'Deployment origin for OAuth/payments' },
  { name: 'AUTH_SECRET', required: true, hint: 'Session signing' },
  { name: 'DATABASE_URL', required: true, hint: 'Postgres for auth/quota' },
] as const
