import { expect, type Page } from '@playwright/test'
import { filterCommandPalette } from './command-helpers'

export async function enablePluginTrustMarket(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('ai-ide:feature:pluginTrustMarket', '1')
  })
}

export async function openPluginManager(page: Page): Promise<void> {
  await filterCommandPalette(page, '插件')
  await page.getByRole('button', { name: /插件管理|Plugin manager/i }).click()
  await expect(page.locator('.modal--plugins')).toBeVisible({ timeout: 10_000 })
}

export async function installHelloSandboxFromMarketplace(page: Page): Promise<void> {
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
}
