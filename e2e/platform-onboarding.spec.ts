/**
 * E2E: v1.5.4 platform onboarding — welcome CTA + free economy quota hint
 */
import { expect, test } from '@playwright/test'
import { gotoApp, openSettingsTab, openWelcomeFromToolbar, prepareGuestUser, prepareLoggedInUser } from './helpers'

test.describe('platform onboarding (v1.5.4)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
  })

  test('welcome screen shows platform CTA and free quota hint', async ({ page }) => {
    await prepareGuestUser(page)
    await gotoApp(page)
    await openWelcomeFromToolbar(page)
    await expect(page.getByTestId('welcome-platform-cta')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('welcome-platform-quota-hint')).toContainText(/200|加权|weighted/i)
  })

  test('settings AI shows platform-only economy hint', async ({ page }) => {
    await gotoApp(page)
    await openSettingsTab(page, 'ai')
    await expect(page.getByTestId('settings-platform-economy-hint')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('settings-platform-economy-hint')).toContainText(/经济|economy/i)
  })
})
