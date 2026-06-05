/**
 * E2E: Plugin ops status card in settings (v1.2.7 F3)
 */
import { expect, test } from '@playwright/test'
import { openPluginManualTab } from './plugin-helpers'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('Plugin ops settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows plugin ops card with health fields', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-plugin-ops')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card).toContainText(/publish|发布/i)
    await expect(card).toContainText(/official|官方|署名/i)
    await expect(card.getByRole('link', { name: /Vercel|生产|production/i }).first()).toBeVisible()
  })

  test('plugin ops reviews filter defaults to all and can select pending', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-plugin-ops')
    await expect(card).toBeVisible({ timeout: 15_000 })
    const filter = card.getByTestId('settings-plugin-ops-status-filter')
    await expect(filter).toBeVisible({ timeout: 15_000 })
    await expect(filter).toHaveValue('all')
    await filter.selectOption('pending')
    await expect(filter).toHaveValue('pending')
    await expect(page.getByTestId('settings-plugin-ops-review-list')).toHaveCount(0, {
      timeout: 5_000,
    })
  })

  test('plugin manager shows manual publish form for logged-in user', async ({ page }) => {
    await openPluginManualTab(page)
    await expect(page.getByTestId('plugin-publish-form')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /提交审核|Submit for review/i })).toBeVisible()
  })
})
