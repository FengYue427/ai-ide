/**
 * E2E: v1.4.8 Activity Line stub + orchestrator event bus
 */
import { expect, test } from '@playwright/test'
import {
  gotoApp,
  openChatPanelFromActivityBar,
  openSettingsTab,
  prepareLoggedInUser,
} from './helpers'

test.describe('v1.4.8 activity line stub', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
    })
    await gotoApp(page)
  })

  test('features tab shows runtime stub card when flag is on', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-aide-runtime-stub')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText(/stub/i)
  })

  test('chat panel shows activity line collapsed by default', async ({ page }) => {
    await openChatPanelFromActivityBar(page)
    const line = page.getByTestId('aide-activity-line')
    await expect(line).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('aide-activity-line-body')).toHaveCount(0)
    await expect(line).toContainText(/点击展开|Click to expand/i)
  })

  test('chat panel shows activity line and displays published event', async ({ page }) => {
    await openChatPanelFromActivityBar(page)
    const line = page.getByTestId('aide-activity-line')
    await expect(line).toBeVisible({ timeout: 10_000 })

    await page.evaluate(() => {
      const bus = (window as Window & { __AIDE_RUNTIME_EVENT_BUS__?: { publish: (e: unknown) => void } })
        .__AIDE_RUNTIME_EVENT_BUS__
      bus?.publish({
        type: 'hook.end',
        at: new Date().toISOString(),
        message: 'pre-run-tests · ok',
      })
    })

    await page.getByTestId('aide-activity-line-toggle').click()
    const body = page.getByTestId('aide-activity-line-body')
    await expect(body.getByText(/pre-run-tests/i)).toBeVisible()
  })
})
