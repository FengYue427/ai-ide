/**
 * E2E: Plugin trust market enable/disable (v1.2.5 F2)
 */
import { expect, test } from '@playwright/test'
import { gotoApp, prepareE2EStorage } from './helpers'
import {
  enablePluginTrustMarket,
  installHelloSandboxFromMarketplace,
  openPluginManager,
} from './plugin-helpers'

test.describe('Plugin trust market (v1.2.5 F2)', () => {
  test.beforeEach(async ({ page }) => {
    await enablePluginTrustMarket(page)
    await prepareE2EStorage(page)
    await gotoApp(page)
  })

  test('shows trust tier badges on marketplace', async ({ page }) => {
    await openPluginManager(page)
    await page.getByRole('button', { name: /插件市场|Marketplace/i }).click()
    await expect(page.getByText(/官方|Official/i).first()).toBeVisible()
    await expect(page.getByText(/已签名|Signed/i).first()).toBeVisible()
  })

  test('disables and re-enables installed marketplace plugin', async ({ page }) => {
    test.setTimeout(120_000)

    await installHelloSandboxFromMarketplace(page)

    await page.getByRole('button', { name: /已安装|Installed/i }).click()
    const modal = page.locator('.modal--plugins')
    const card = modal.locator('.plugins-grid .plugins-panel').filter({
      hasText: /Hello 沙箱|Hello Sandbox/i,
    })
    await expect(card).toBeVisible({ timeout: 15_000 })

    const toggle = card.locator('.plugins-card-actions').getByRole('button').first()
    await expect(toggle).toBeVisible({ timeout: 15_000 })

    const label = ((await toggle.textContent()) ?? '').trim()
    if (/启用|Enable/i.test(label)) {
      await toggle.click()
      await expect(card.getByText(/运行中|Running/i)).toBeVisible({ timeout: 15_000 })
    }

    await expect(toggle).toHaveText(/停用|Disable/i, { timeout: 10_000 })
    await toggle.click()
    await expect(modal.locator('.alert-banner--success').filter({ hasText: /插件已停用|Plugin disabled/i })).toBeVisible({
      timeout: 15_000,
    })

    await expect(toggle).toHaveText(/启用|Enable/i, { timeout: 10_000 })
    await toggle.click()
    await expect(modal.locator('.alert-banner--success').filter({ hasText: /插件已启用|Plugin enabled/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(card.getByText(/运行中|Running/i)).toBeVisible()
  })
})
