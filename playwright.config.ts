import { defineConfig, devices } from '@playwright/test'

const uiPort = 4173
const stackPort = 3000
const isCi = !!process.env.CI
const e2eTarget = (process.env.E2E_TARGET || '').toLowerCase()

/** Always preview production build — matches CI and avoids dev-server flake on Windows. */
const uiWebServerCommand = `npx vite preview --host 127.0.0.1 --port ${uiPort} --strictPort`

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  workers: isCi ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  webServer:
    e2eTarget === 'fullstack' || e2eTarget === 'collab'
      ? {
          command:
            e2eTarget === 'collab' ? 'npm run dev:stack:collab' : 'npm run dev:stack',
          url: `http://127.0.0.1:${stackPort}`,
          reuseExistingServer: !isCi,
          timeout: 180_000,
        }
      : {
          command: uiWebServerCommand,
          url: `http://127.0.0.1:${uiPort}`,
          reuseExistingServer: !isCi,
          timeout: 180_000,
        },
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
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${stackPort}`,
      },
    },
    {
      name: 'collab',
      testMatch: '**/collab-smoke.spec.ts',
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${stackPort}`,
      },
    },
  ],
})
