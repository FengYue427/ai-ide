import { expect, test } from '@playwright/test'
import { gotoApp, prepareE2EStorage } from './helpers'

async function openPluginManager(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
  await page.getByPlaceholder(/命令|文件名|@/).fill('插件')
  await page.getByRole('button', { name: /插件管理|Plugin manager/i }).click()
  await expect(page.locator('.modal--plugins')).toBeVisible({ timeout: 10_000 })
}

test.describe('Plugin marketplace (v1.2 F5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:pluginTrustMarket', '1')
    })
    await prepareE2EStorage(page)
    await gotoApp(page)
  })

  test('installs official catalog plugin from marketplace', async ({ page }) => {
    await openPluginManager(page)
    await page.getByRole('button', { name: /插件市场|Marketplace/i }).click()

    const helloCard = page.locator('.plugins-panel').filter({
      hasText: /Hello 沙箱|Hello Sandbox/i,
    })
    await helloCard.scrollIntoViewIfNeeded()
    await helloCard.getByRole('button', { name: /安装|Install/i }).click()

    await expect(page.getByText(/已从插件市场安装|Installed from marketplace/i)).toBeVisible({
      timeout: 10_000,
    })

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
