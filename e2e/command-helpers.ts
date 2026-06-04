import { expect, type Locator, type Page } from '@playwright/test'

export async function openCommandPalette(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
  await expect(page.locator('.command-palette-overlay')).toBeVisible({ timeout: 10_000 })
  const input = page.getByPlaceholder(/命令|文件名|@|Command, file/i)
  await expect(input).toBeVisible({ timeout: 5_000 })
  return input
}

export async function filterCommandPalette(page: Page, query: string): Promise<Locator> {
  const input = await openCommandPalette(page)
  await input.fill(query)
  return input
}

export async function closeCommandPalette(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.locator('.command-palette-overlay')).toHaveCount(0, { timeout: 5_000 })
}
