import { defineConfig, devices } from '@playwright/test'

const uiPort = 4173
const stackPort = 3000
const apiPort = 3001
const isCi = !!process.env.CI
const e2eTarget = (process.env.E2E_TARGET || '').toLowerCase()
/** Separate from Electron `dist/` to avoid Windows EBUSY when the desktop shell holds assets open. */
const e2eDistDir = process.env.E2E_DIST_DIR || (isCi ? 'dist' : 'dist-e2e')

/** Always preview production build — matches CI and avoids dev-server flake on Windows. */
const uiPreviewCommand = `npx vite preview --host 127.0.0.1 --port ${uiPort} --strictPort --outDir ${e2eDistDir}`
/** Local runs rebuild so stale dist cannot satisfy E2E; CI job runs `npm run build` first. */
const uiBuildCommand = `npm run build -- --outDir ${e2eDistDir}`
const uiWebServerCommand = isCi ? uiPreviewCommand : `${uiBuildCommand} && ${uiPreviewCommand}`

const stackPreviewCommand = `npx vite preview --host 127.0.0.1 --port ${stackPort} --strictPort --outDir ${e2eDistDir}`
const stackBuildCommand =
  e2eTarget === 'collab'
    ? `npm run build -- --mode collab-e2e --outDir ${e2eDistDir}`
    : `npm run build -- --outDir ${e2eDistDir}`
const stackPreviewWebServerCommand = isCi ? stackPreviewCommand : `${stackBuildCommand} && ${stackPreviewCommand}`

const apiWebServer = {
  command: 'npm run dev:api',
  url: `http://127.0.0.1:${apiPort}/api/auth/session`,
  reuseExistingServer: false,
  timeout: 120_000,
} as const

/** UI E2E hits /api/* via Vite preview proxy — API must listen on 3001 (see vite.config preview.proxy). */
const uiWebServers = [
  apiWebServer,
  {
    command: uiWebServerCommand,
    url: `http://127.0.0.1:${uiPort}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
] as const

/** Full-stack / collab E2E — API + preview in CI; local may use dev:stack for faster iteration. */
const stackWebServers = isCi
  ? ([
      apiWebServer,
      {
        command: stackPreviewWebServerCommand,
        url: `http://127.0.0.1:${stackPort}`,
        reuseExistingServer: false,
        timeout: 180_000,
      },
    ] as const)
  : ({
      command: e2eTarget === 'collab' ? 'npm run dev:stack:collab' : 'npm run dev:stack',
      url: `http://127.0.0.1:${stackPort}`,
      reuseExistingServer: !isCi,
      timeout: 180_000,
    } as const)

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  workers: isCi ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  webServer:
    e2eTarget === 'fullstack' || e2eTarget === 'collab' ? stackWebServers : uiWebServers,
  projects: [
    {
      name: 'ui',
      testIgnore: ['**/fullstack.spec.ts', '**/collab-smoke.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${uiPort}`,
      },
    },
    {
      name: 'fullstack',
      testMatch: '**/fullstack.spec.ts',
      timeout: 120_000,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${stackPort}`,
      },
    },
    {
      name: 'collab',
      testMatch: '**/collab-smoke.spec.ts',
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${stackPort}`,
      },
    },
  ],
})
