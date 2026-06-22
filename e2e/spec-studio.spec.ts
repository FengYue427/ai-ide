/**

 * E2E: Spec Studio MVP — open panel and create stack template spec

 */

import { expect, test } from '@playwright/test'

import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'



async function fillWizardAndCreate(

  page: import('@playwright/test').Page,

  options: { name: string; templateId?: string; goal?: string },

) {

  await page.getByTestId('spec-studio-name').fill(options.name)

  if (options.goal) {

    await page.getByTestId('spec-studio-goal').fill(options.goal)

  }

  await page.getByTestId('spec-studio-next').click()

  if (options.templateId) {

    await page.getByTestId(`spec-studio-template-${options.templateId}`).click()

  }

  await page.getByTestId('spec-studio-next').click()

  await expect(page.getByTestId('spec-studio-preview')).toBeVisible({ timeout: 10_000 })

  await page.getByTestId('spec-studio-create').click()

}



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

    await expect(page.getByTestId('spec-studio-next')).toBeVisible({ timeout: 10_000 })



    await fillWizardAndCreate(page, { name: 'e2e-node-api', templateId: 'node-api' })



    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })

    await expect(page.getByTestId('spec-studio-created-hint')).toContainText('.aide/specs/e2e-node-api/tasks.md')

  })



  test('command palette opens Spec Studio', async ({ page }) => {

    await page.keyboard.press('Control+Shift+P')

    const palette = page.locator('.command-palette-overlay')

    await expect(palette).toBeVisible({ timeout: 10_000 })

    await page.keyboard.type('Spec Studio')

    await page.keyboard.press('Enter')

    await expect(page.getByTestId('spec-studio-next')).toBeVisible({ timeout: 10_000 })

  })



  test('sidebar sparkle button opens Spec Studio', async ({ page }) => {

    await page.getByTestId('sidebar-new-spec').click()

    await expect(page.getByTestId('spec-studio-next')).toBeVisible({ timeout: 10_000 })

  })



  test('create without name shows validation hint', async ({ page }) => {

    await page.getByTestId('sidebar-new-spec').click()

    await page.getByTestId('spec-studio-next').click()

    await expect(page.getByTestId('spec-studio-name-hint')).toBeVisible()

  })



  test('template grid scrolls to last card without clipping', async ({ page }) => {

    await page.getByTestId('sidebar-new-spec').click()

    await expect(page.getByTestId('spec-studio-next')).toBeVisible({ timeout: 10_000 })



    await page.getByTestId('spec-studio-name').fill('scroll-test')

    await page.getByTestId('spec-studio-next').click()



    const lastTemplate = page.getByTestId('spec-studio-template-course-capstone')

    await lastTemplate.scrollIntoViewIfNeeded()

    await expect(lastTemplate).toBeVisible()

    const box = await lastTemplate.boundingBox()

    expect(box).not.toBeNull()

    if (box) {

      const viewport = page.viewportSize()

      expect(viewport).not.toBeNull()

      if (viewport) {

        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2)

      }

    }

  })



  test('execute first task opens chat and activity line', async ({ page }) => {

    await page.getByTestId('sidebar-new-spec').click()

    await fillWizardAndCreate(page, { name: 'e2e-exec-flow', templateId: 'blank' })

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

    await fillWizardAndCreate(page, { name: 'e2e-status-chip' })

    await expect(page.getByTestId('spec-studio-created-hint')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /取消|Cancel/i }).click()



    const chip = page.getByTestId('status-spec-studio')

    await expect(chip).toBeVisible({ timeout: 10_000 })

    await expect(chip).toContainText(/Spec/i)

    await expect(page.getByTestId('status-spec-run')).toBeVisible()

  })

})


