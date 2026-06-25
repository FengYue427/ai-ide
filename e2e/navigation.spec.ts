import { expect, test } from '@playwright/test'
import { gotoApp, openWelcomeFromToolbar } from './helpers'

test.describe('Navigation & welcome', () => {
  test('command palette opens template modal from welcome flow', async ({ page }) => {
    await gotoApp(page)

    await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
    await page.getByPlaceholder(/命令|文件名|@|Command, file name/i).fill('模板')
    await page.getByRole('button', { name: /从模板新建项目|New project from template/i }).click()

    await expect(page.getByText(/选择项目模板|Choose a project template/i)).toBeVisible({ timeout: 10_000 })
  })

  test('return to welcome screen from command palette', async ({ page }) => {
    await gotoApp(page)

    await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
    await page.getByPlaceholder(/命令|文件名|@|Command, file name/i).fill('欢迎')
    await page
      .getByRole('button', {
        name: /返回欢迎页|Back to welcome/i,
      })
      .click()

    await expect(page.getByText(/快速开始|Quick start/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/从模板新建项目|New project from template/i)).toBeVisible()
  })

  test('toolbar home button opens welcome screen', async ({ page }) => {
    await gotoApp(page)
    await openWelcomeFromToolbar(page)
    await expect(page.getByText(/快速开始|Quick start/i)).toBeVisible({ timeout: 10_000 })
  })

  test('welcome feature card opens settings', async ({ page }) => {
    await gotoApp(page)
    await openWelcomeFromToolbar(page)
    await page.locator('button.welcome-feature-card').filter({ hasText: /主题与设置|Theme & settings/i }).click()
    await expect(page.getByText(/把环境调成你顺手的样子|Tune the environment to your workflow/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
