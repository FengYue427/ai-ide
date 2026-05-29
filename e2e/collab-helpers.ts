import { expect, type Page } from '@playwright/test'
import { gotoApp, prepareE2EStorage, waitForShellReady } from './helpers'

export type RegisteredUser = {
  email: string
  password: string
}

export function uniqueCollabUser(prefix: string): RegisteredUser {
  const stamp = Date.now().toString(36)
  return {
    email: `${prefix}-${stamp}@ai-ide.local`,
    password: 'TestPass123!',
  }
}

/** Register + login via auth modal (full stack). */
export async function registerAndLogin(page: Page, user: RegisteredUser): Promise<void> {
  await gotoApp(page)

  await page.getByRole('button', { name: '登录' }).click()
  await page.getByText('立即注册').click()
  await page.getByPlaceholder('name@example.com').fill(user.email)
  await page.getByPlaceholder('至少 8 位字符').fill(user.password)
  await page.getByPlaceholder('再次输入密码').fill(user.password)
  await page.getByRole('button', { name: '创建账号' }).click()

  await expect(page.locator(`button[title="${user.email}"]`)).toBeVisible({ timeout: 30_000 })
}

export async function openCollabPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: '命令面板' }).click()
  await page.getByPlaceholder(/命令 \/ 文件名|Command, file name/i).fill('协作')
  await page.getByRole('button', { name: '实时协作' }).click()
  await expect(page.locator('.modal--collab')).toBeVisible({ timeout: 15_000 })
}

/** Host creates a server-backed room (M1). Returns 8-char invite code. */
export async function createCollabRoomAsHost(page: Page): Promise<string> {
  await openCollabPanel(page)
  await page.locator('.modal--collab').getByRole('button', { name: '创建房间' }).click()
  await expect(page.locator('.modal--collab .collab-leave-btn')).toBeVisible({ timeout: 30_000 })
  const code = await page.locator('.modal--collab .collab-room-id strong').textContent()
  expect(code?.trim().length).toBeGreaterThanOrEqual(6)
  return code!.trim()
}

export async function joinCollabRoomAsViewer(page: Page, roomCode: string): Promise<void> {
  await openCollabPanel(page)
  const modal = page.locator('.modal--collab')
  await modal
    .locator('.form-group')
    .filter({ hasText: '房间 ID' })
    .getByRole('textbox')
    .fill(roomCode)
  await modal.getByText('只读', { exact: true }).click()
  await modal.getByRole('button', { name: '加入房间' }).click()
  await expect(modal.getByRole('button', { name: '离开房间' })).toBeVisible({ timeout: 30_000 })
}

export async function prepareFreshPage(page: Page, path = '/'): Promise<void> {
  await prepareE2EStorage(page)
  await page.goto(path)
  await waitForShellReady(page)
}
