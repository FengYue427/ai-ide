/**
 * E2E: v1.5.8 regression — i18n surfaces + settings polish
 */
import { expect, test } from '@playwright/test'
import { gotoApp, openSettingsTab, openSubscriptionFromToolbar, prepareLoggedInUser } from './helpers'

test.describe('v1.5.8 regression', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
  })

  test('spec catalog shows localized title and search placeholder', async ({ page }) => {
    await gotoApp(page)
    await openSettingsTab(page, 'features')
    await expect(page.getByText('Specs 目录（.aide/specs）')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('搜索 Spec 名 / 路径')).toBeVisible()
  })

  test('subscription modal shows Stripe and CN pricing labels', async ({ page }) => {
    await gotoApp(page)
    await openSubscriptionFromToolbar(page)
    await expect(page.getByText('$9.99').first()).toBeVisible()
    await expect(page.getByText(/(公测期|Stripe|Stripe 订阅|¥39|支付宝|Alipay)/)).toBeVisible()
  })

  test('welcome platform quota hint still visible from welcome screen', async ({ page }) => {
    await gotoApp(page)
    await page.locator('header.toolbar').getByRole('button', { name: /^(Back to welcome|返回欢迎页)$/ }).click()
    await expect(page.getByTestId('welcome-platform-quota-hint')).toBeVisible({ timeout: 10_000 })
  })
})
