import { test, expect } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
  type E2ESeedFile,
} from './helpers'

const E2E_RUNTIME_STATE_FILES: E2ESeedFile[] = [
  {
    name: 'index.js',
    content: 'console.log("aide runtime e2e")',
    language: 'javascript',
  },
  {
    name: '.aide/meta/runtime-state.json',
    content: JSON.stringify({
      version: 1,
      activeSpecPath: '.aide/specs/demo/tasks.md',
      queueSnapshot: { specPending: 1, planPending: 0 },
      updatedAt: '2026-06-05T10:00:05Z',
    }),
    language: 'json',
  },
]

test.describe('v1.5 aide runtime F4/F6', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page, E2E_RUNTIME_STATE_FILES)
    await page.evaluate(() => {
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
      localStorage.setItem('ai-ide:feature:aideRuntime', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('shows runtime production card in settings', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-aide-runtime-stub')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText('F4')).toBeVisible()
  })

  test('shows runtime-state summary block when state file exists', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const summary = page.getByTestId('settings-runtime-state-summary')
    await expect(summary).toBeVisible({ timeout: 10_000 })
  })
})
