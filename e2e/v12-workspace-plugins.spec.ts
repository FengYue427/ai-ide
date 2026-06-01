import { expect, test } from '@playwright/test'
import { gotoApp, prepareE2EStorage } from './helpers'

test.describe('v1.2 workspace + plugins smoke (F5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:multiRoot', '1')
      localStorage.setItem('ai-ide:feature:pluginTrustMarket', '1')
    })
    await prepareE2EStorage(page)
    await gotoApp(page)
  })

  test('switches workspace root then installs marketplace plugin', async ({ page }) => {
    const switcher = page.getByTestId('workspace-root-switcher')
    await expect(switcher).toBeVisible({ timeout: 10_000 })
    await switcher.getByRole('button', { name: /添加工作区根|Add workspace root/i }).click()
    await expect(page.locator('#workspace-root-select option')).toHaveCount(2, { timeout: 5_000 })

    await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
    await page.getByPlaceholder(/命令|文件名|@/).fill('插件')
    await page.getByRole('button', { name: /插件管理|Plugin manager/i }).click()
    await page.getByRole('button', { name: /插件市场|Marketplace/i }).click()

    const helloCard = page.locator('.plugins-panel').filter({
      hasText: /Hello 沙箱|Hello Sandbox/i,
    })
    await helloCard.getByRole('button', { name: /安装|Install/i }).click()
    await expect(page.getByText(/已从插件市场安装|Installed from marketplace/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
