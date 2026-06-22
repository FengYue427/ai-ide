/**
 * E2E: B4 Acceptance Editor — structured criteria + verify
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('Acceptance Editor B4', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('opens from spec catalog and toggles criterion', async ({ page }) => {
    await page.getByTestId('sidebar-new-spec').click()
    await page.getByTestId('spec-studio-name').fill('b4-acceptance')
    await page.getByTestId('spec-studio-template-blank').click()
    await page.getByTestId('spec-studio-create').click()
    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /取消|Cancel/i }).click()

    await openSettingsTab(page, 'features')
    await page.getByTestId('spec-open-acceptance-b4-acceptance').click()

    await expect(page.getByTestId('acceptance-editor-list')).toBeVisible({ timeout: 10_000 })
    const firstCheckbox = page.locator('[data-testid^="acceptance-criterion-"]').first()
    await firstCheckbox.check()
    await page.getByTestId('acceptance-editor-verify').click()
    await expect(page.getByTestId('acceptance-editor-result')).toBeVisible()
  })
})
