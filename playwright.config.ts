import { defineConfig, devices } from '@playwright/test'

const uiPort = 4173
const stackPort = 3000

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  projects: [
    {
      name: 'ui',
      testIgnore: '**/fullstack.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${uiPort}`,
      },
      webServer: {
        command: `npm run dev -- --host 127.0.0.1 --port ${uiPort}`,
        url: `http://127.0.0.1:${uiPort}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
    {
      name: 'fullstack',
      testMatch: '**/fullstack.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${stackPort}`,
      },
      webServer: {
        command: 'npm run dev:stack',
        url: `http://127.0.0.1:${stackPort}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
    },
  ],
})
