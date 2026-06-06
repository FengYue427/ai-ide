/**
 * E2E: v1.5.7 Spec catalog UI polish — hooks creation guide
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('spec catalog UI (v1.5.7)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows hooks guide when no specs exist', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const guide = page.getByTestId('spec-catalog-hooks-guide')
    await expect(guide).toBeVisible({ timeout: 10_000 })
    await expect(guide).toContainText(/hooks\.yaml/i)
    await guide.getByRole('button').click()
    await expect(guide).toHaveCount(0)
  })
})
