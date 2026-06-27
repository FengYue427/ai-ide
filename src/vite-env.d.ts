/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string | undefined
  readonly VITE_API_BASE_URL: string | undefined
  readonly VITE_PUBLIC_WELFARE: string | undefined
  readonly VITE_GA_LIVE: string | undefined
  readonly VITE_SENTRY_DSN: string | undefined
  readonly VITE_APP_VERSION: string | undefined
  readonly VITE_DESKTOP_DOWNLOAD_URL: string | undefined
  readonly VITE_DESKTOP_SHELL: string | undefined
  readonly VITE_MULTI_ROOT: string | undefined
  readonly VITE_PLUGIN_TRUST_MARKET: string | undefined
  readonly VITE_VIRTUAL_FILE_TREE: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
