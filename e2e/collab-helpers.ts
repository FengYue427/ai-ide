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

  await page.getByRole('button', { name: /登录|Sign in/i }).click()
  await page.getByText(/立即注册|Sign up/i).click()
  await page.getByPlaceholder('name@example.com').fill(user.email)
  await page.getByPlaceholder(/至少 8 位|8 characters/i).fill(user.password)
  await page.getByPlaceholder(/再次输入|Confirm/i).fill(user.password)
  await page.getByRole('button', { name: /创建账号|Create account/i }).click()

  await expect(page.locator(`button[title="${user.email}"]`)).toBeVisible({ timeout: 30_000 })
}

export async function openCollabPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
  await page.getByPlaceholder(/命令 \/ 文件名|Command, file name/i).fill('协作')
  await page.getByRole('button', { name: /实时协作|Live collaboration/i }).click()
  await expect(page.locator('.modal--collab')).toBeVisible({ timeout: 15_000 })
}

/** Host creates a server-backed room (M1). Returns invite code. */
export async function createCollabRoomAsHost(page: Page): Promise<string> {
  await openCollabPanel(page)
  await page
    .locator('.modal--collab')
    .getByRole('button', { name: /创建房间|Create room/i })
    .click()
  await expect(page.locator('.modal--collab .collab-leave-btn')).toBeVisible({ timeout: 30_000 })
  const code = await page.getByTestId('collab-room-code').locator('strong').textContent()
  expect(code?.trim().length).toBeGreaterThanOrEqual(6)
  return code!.trim()
}

export async function joinCollabRoomAsViewer(page: Page, roomCode: string): Promise<void> {
  await openCollabPanel(page)
  const modal = page.locator('.modal--collab')
  await modal
    .locator('.form-group')
    .filter({ hasText: /房间 ID|Room ID/i })
    .getByRole('textbox')
    .fill(roomCode)
  await modal.locator('input[name="collab-join-role"][value="viewer"]').check()
  await modal.getByRole('button', { name: /加入房间|Join room/i }).click()
  await expect(modal.getByRole('button', { name: /离开房间|Leave/i })).toBeVisible({ timeout: 30_000 })
}

export async function prepareFreshPage(page: Page, path = '/'): Promise<void> {
  await prepareE2EStorage(page)
  await page.goto(path)
  await waitForShellReady(page)
}
