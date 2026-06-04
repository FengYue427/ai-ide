/**
 * E2E: Plugin ops status card in settings (v1.2.7 F3)
 */
import { expect, test } from '@playwright/test'
import { prepareE2EStorage, prepareLoggedInUser, openSettingsFromToolbar, waitForShellReady } from './helpers'

test.describe('Plugin ops settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows plugin ops card with health fields', async ({ page }) => {
    await openSettingsFromToolbar(page)
    await page.getByRole('button', { name: /^功能$|^Features$/i }).click()
    const card = page.getByTestId('settings-plugin-ops')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText(/publish|发布/i)
    await expect(card).toContainText(/official|官方|署名/i)
    await expect(card.getByRole('link', { name: /Vercel|生产|production/i }).first()).toBeVisible()
  })
})
