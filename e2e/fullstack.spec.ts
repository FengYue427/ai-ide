import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

/**
 * Requires dev:stack (Vite :3000 + API :3001) and Postgres (see npm run db:setup).
 * Run: npm run test:e2e:stack
 */
test.describe('Full stack (API + UI)', () => {
  test('registers and saves a cloud workspace', async ({ page }) => {
    const email = `e2e-${Date.now()}@ai-ide.local`
    const password = 'TestPass123!'
    const workspaceName = `e2e-ws-${Date.now().toString(36)}`

    await gotoApp(page)

    await page.getByRole('button', { name: '登录' }).click()
    await page.getByText('立即注册').click()
    await page.getByPlaceholder('name@example.com').fill(email)
    await page.getByPlaceholder('至少 8 位字符').fill(password)
    await page.getByPlaceholder('再次输入密码').fill(password)
    await page.getByRole('button', { name: '创建账号' }).click()

    await expect(page.locator(`button[title="${email}"]`)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: '工作区管理' }).click()
    const workspaceModal = page.locator('.wm-modal')
    await expect(workspaceModal.locator('.modal-title').filter({ hasText: '工作区管理' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(workspaceModal.getByText(/同步到云端/)).toBeVisible({ timeout: 10_000 })

    // 打开保存表单并通过滚动容器点击提交（CI 下按钮常在滚动区外）
    await workspaceModal.getByRole('button', { name: '保存当前工作区' }).click()
    const nameInput = workspaceModal.getByPlaceholder('工作区名称')
    await nameInput.fill(workspaceName)

    // Scroll modal body to reveal action buttons
    const modalBody = workspaceModal.locator('.wm-body')
    await modalBody.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })

    const saveBtn = workspaceModal.locator('.wm-form-actions').getByRole('button', {
      name: '保存',
      exact: true,
    })
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 })
    // Playwright click can still fail when button stays outside viewport in CI;
    // invoke native click directly to trigger onClick handler reliably.
    await saveBtn.evaluate((btn) => (btn as HTMLButtonElement).click())

    // 仅断言工作区管理器内的成功条，避免 toast + banner 双匹配导致 strict mode
    await expect(
      workspaceModal.locator('.wm-flash-row.alert-banner--success').filter({ hasText: '工作区已保存' }),
    ).toBeVisible({ timeout: 15_000 })
  })
})
