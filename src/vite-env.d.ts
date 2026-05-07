/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string | undefined
  // 添加其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
