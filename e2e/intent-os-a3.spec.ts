/**
 * E2E: Intent OS A3/A4/A5 — Spec Studio formalization wizard
 */
import { expect, test } from '@playwright/test'
import { prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

async function openSpecStudio(page: import('@playwright/test').Page) {
  await page.getByTestId('sidebar-new-spec').click()
  await expect(page.getByTestId('spec-studio-next')).toBeVisible({ timeout: 10_000 })
}

async function advanceToPreview(page: import('@playwright/test').Page, name: string, goal: string) {
  await page.getByTestId('spec-studio-name').fill(name)
  await page.getByTestId('spec-studio-goal').fill(goal)
  await page.getByTestId('spec-studio-next').click()
  await expect(page.getByTestId('spec-studio-step-template')).toHaveClass(/spec-studio-step--active/)
  await page.getByTestId('spec-studio-template-blank').click()
  await page.getByTestId('spec-studio-next').click()
  await expect(page.getByTestId('spec-studio-preview')).toBeVisible({ timeout: 10_000 })
}

test.describe('Intent OS A3 formalization wizard', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('wizard steps: intent → template → preview → create', async ({ page }) => {
    await openSpecStudio(page)
    await expect(page.getByTestId('spec-studio-step-intent')).toHaveClass(/spec-studio-step--active/)

    await advanceToPreview(page, 'e2e-wizard-spec', 'Add login refresh token')

    await expect(page.getByTestId('spec-studio-preview-stats')).toBeVisible()
    await page.getByTestId('spec-studio-preview-tab-requirements').click()
    const editor = page.getByTestId('spec-studio-preview-editor')
    await expect(editor).toContainText('Add login refresh token')

    await page.getByTestId('spec-studio-preview-tab-tasks').click()
    await editor.fill('# Tasks\n\n- [ ] Custom wizard task\n')

    await page.getByTestId('spec-studio-create').click()
    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('spec-studio-created-hint')).toContainText('.aide/specs/e2e-wizard-spec/tasks.md')
  })

  test('create without name shows validation hint on step 1', async ({ page }) => {
    await openSpecStudio(page)
    await page.getByTestId('spec-studio-next').click()
    await expect(page.getByTestId('spec-studio-name-hint')).toBeVisible()
  })
})
