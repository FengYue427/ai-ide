import { expect, test } from '@playwright/test'
import { gotoApp, prepareE2EStorage } from './helpers'
import {
  enablePluginTrustMarket,
  installHelloSandboxFromMarketplace,
  openPluginManager,
} from './plugin-helpers'

test.describe('Plugin marketplace (v1.2 F5)', () => {
  test.beforeEach(async ({ page }) => {
    await enablePluginTrustMarket(page)
    await prepareE2EStorage(page)
    await gotoApp(page)
  })

  test('installs official catalog plugin from marketplace', async ({ page }) => {
    await installHelloSandboxFromMarketplace(page)

    await page.getByRole('button', { name: /已安装|Installed/i }).click()
    await expect(page.getByText(/Hello 沙箱|Hello Sandbox/i)).toBeVisible()
    await expect(page.getByText(/已安装|Installed/i).first()).toBeVisible()
  })

  test('shows trust tier badges when trust market flag is on', async ({ page }) => {
    await openPluginManager(page)
    await page.getByRole('button', { name: /插件市场|Marketplace/i }).click()
    await expect(page.getByText(/官方|Official/i).first()).toBeVisible()
    await expect(page.getByText(/已签名|Signed/i).first()).toBeVisible()
  })
})
