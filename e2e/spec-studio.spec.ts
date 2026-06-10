/**
 * E2E: Spec Studio MVP — open panel and create stack template spec
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('Spec Studio MVP', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('opens from settings and creates node-api spec', async ({ page }) => {
    await openSettingsTab(page, 'features')
    await page.getByTestId('spec-catalog-open-studio').click()
    await expect(page.getByTestId('spec-studio-create')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('spec-studio-template-node-api').click()
    await page.getByPlaceholder(/auth-refactor|例如/i).fill('e2e-node-api')
    await page.getByTestId('spec-studio-create').click()

    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('spec-studio-created-hint')).toContainText('.aide/specs/e2e-node-api/tasks.md')
  })

  test('command palette opens Spec Studio', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P')
    const palette = page.locator('.command-palette-overlay')
    await expect(palette).toBeVisible({ timeout: 10_000 })
    await page.keyboard.type('Spec Studio')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('spec-studio-create')).toBeVisible({ timeout: 10_000 })
  })

  test('sidebar sparkle button opens Spec Studio', async ({ page }) => {
    await page.getByTestId('sidebar-new-spec').click()
    await expect(page.getByTestId('spec-studio-create')).toBeVisible({ timeout: 10_000 })
  })

  test('execute first task opens chat and activity line', async ({ page }) => {
    await page.getByTestId('sidebar-new-spec').click()
    await page.getByTestId('spec-studio-template-blank').click()
    await page.getByPlaceholder(/auth-refactor|例如/i).fill('e2e-exec-flow')
    await page.getByTestId('spec-studio-create').click()
    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('spec-studio-execute').click()

    await expect(page.locator('.chat-panel')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('aide-activity-line')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('aide-activity-line-toggle').click()
    const body = page.getByTestId('aide-activity-line-body')
    await expect(body).toBeVisible()
    await expect(body).toContainText(/e2e-exec-flow|spec queue|enqueue spec/i)
  })

  test('status bar spec chip appears after creating spec', async ({ page }) => {
    await page.getByTestId('sidebar-new-spec').click()
    await page.getByPlaceholder(/auth-refactor|例如/i).fill('e2e-status-chip')
    await page.getByTestId('spec-studio-create').click()
    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /取消|Cancel/i }).click()

    const chip = page.getByTestId('status-spec-studio')
    await expect(chip).toBeVisible({ timeout: 10_000 })
    await expect(chip).toContainText(/Spec/i)
    await expect(page.getByTestId('status-spec-run')).toBeVisible()
  })
})
