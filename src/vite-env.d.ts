/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string | undefined
  readonly VITE_API_BASE_URL: string | undefined
  readonly VITE_GA_LIVE: string | undefined
  readonly VITE_SENTRY_DSN: string | undefined
  readonly VITE_APP_VERSION: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
