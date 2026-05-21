import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

test.describe('Auth & workspace UI', () => {
  test('login modal supports register tab', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page.getByText('登录以同步您的工作区数据')).toBeVisible({ timeout: 10_000 })

    await page.getByText('立即注册').click()
    await expect(page.getByText('注册后即可开始使用云同步功能')).toBeVisible()
    await expect(page.getByPlaceholder('至少 8 位字符')).toBeVisible()
  })

  test('workspace manager shows local-first hint when logged out', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: '工作区管理' }).click()
    await expect(page.locator('.modal-title').filter({ hasText: '工作区管理' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/导入旧备份/)).toBeVisible()
    await expect(page.getByRole('button', { name: '保存当前工作区' })).toBeVisible()
  })

  test('workspace save form opens from manager', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: '工作区管理' }).click()
    await page.getByRole('button', { name: '保存当前工作区' }).click()
    await expect(page.getByPlaceholder('工作区名称')).toBeVisible({ timeout: 10_000 })
  })
})
