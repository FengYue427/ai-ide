import { expect, test } from '@playwright/test'

test.describe('Navigation & welcome', () => {
  test('command palette opens template modal from welcome flow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /命令面板/ }).click()
    await page.getByPlaceholder(/命令|文件名|@/).fill('模板')
    await page.getByRole('button', { name: '从模板新建项目' }).click()

    await expect(page.getByText('选择项目模板')).toBeVisible({ timeout: 10_000 })
  })

  test('return to welcome screen from command palette', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /命令面板/ }).click()
    await page.getByPlaceholder(/命令|文件名|@/).fill('欢迎')
    await page.getByRole('button', { name: '返回欢迎页' }).click()

    await expect(page.getByText('快速开始')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('从模板新建项目')).toBeVisible()
  })

  test('toolbar home button opens welcome screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: '返回欢迎页' }).click()
    await expect(page.getByText('快速开始')).toBeVisible({ timeout: 10_000 })
  })

  test('welcome feature card opens settings', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /命令面板/ }).click()
    await page.getByPlaceholder(/命令|文件名|@/).fill('欢迎')
    await page.getByRole('button', { name: '返回欢迎页' }).click()

    await page.getByRole('button', { name: '主题与设置' }).click()
    await expect(page.getByText('设置中心')).toBeVisible({ timeout: 10_000 })
  })
})
