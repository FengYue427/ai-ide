/**
 * E2E: Tier B1 — Unified Intent Shell
 */
import { expect, test } from '@playwright/test'
import { prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('Intent OS B1 Intent Shell', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('shows intent shell rails after creating a spec', async ({ page }) => {
    await page.getByTestId('sidebar-new-spec').click()
    await page.getByTestId('spec-studio-name').fill('e2e-intent-shell')
    await page.getByTestId('spec-studio-next').click()
    await page.getByTestId('spec-studio-template-blank').click()
    await page.getByTestId('spec-studio-next').click()
    await page.getByTestId('spec-studio-create').click()
    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })

    await expect(page.getByTestId('intent-shell-bar')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('intent-shell-left')).toBeVisible()
    await expect(page.getByTestId('intent-shell-queue')).toBeVisible()
    await expect(page.getByTestId('intent-shell-autopilot-next')).toBeVisible()
  })
})
