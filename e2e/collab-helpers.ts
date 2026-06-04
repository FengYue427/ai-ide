import { expect, type Page } from '@playwright/test'
import { dismissAuthModalIfOpen, gotoApp, prepareE2EStorage, waitForShellReady } from './helpers'

export type RegisteredUser = {
  email: string
  password: string
}

async function waitForApiReady(page: Page): Promise<void> {
  const origin = new URL(page.url()).origin
  let lastStatus: number | null = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await page.request.get(`${origin}/api/auth/session`, { timeout: 5_000 })
      lastStatus = res.status()
      // 200 (anon session) is fine; other 2xx/4xx means server is responding.
      if (lastStatus >= 200 && lastStatus < 500) return
    } catch {
      // keep trying
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`API not ready (lastStatus=${lastStatus ?? 'n/a'})`)
}

export function uniqueCollabUser(prefix: string): RegisteredUser {
  const stamp = Date.now().toString(36)
  return {
    // Must pass frontend email validation (requires a dot in domain).
    email: `${prefix}-${stamp}@ai-ide.local.test`,
    password: 'TestPass123!',
  }
}

/** Register + login via auth modal (full stack). */
export async function registerAndLogin(page: Page, user: RegisteredUser): Promise<void> {
  await gotoApp(page)
  await waitForApiReady(page)

  await page.getByRole('button', { name: /登录|Sign in/i }).click()
  await page.getByText(/立即注册|Sign up/i).click()
  await page.getByPlaceholder('name@example.com').fill(user.email)
  await page.getByPlaceholder(/至少 8 位|8 characters/i).fill(user.password)
  await page.getByPlaceholder(/再次输入|Confirm/i).fill(user.password)
  await page.getByRole('button', { name: /创建账号|Create account/i }).click()

  // If registration fails, surface the inline error (helps CI diagnostics).
  const errorAlert = page.locator('.auth-alert-error')
  await Promise.race([
    expect(page.locator(`button[title="${user.email}"]`)).toBeVisible({ timeout: 45_000 }),
    expect(errorAlert).toBeVisible({ timeout: 15_000 }),
  ])
  if (await errorAlert.isVisible()) {
    const text = (await errorAlert.textContent())?.trim() || 'register failed'
    throw new Error(text)
  }
  await dismissAuthModalIfOpen(page)
}

export async function openCollabPanel(page: Page): Promise<void> {
  await dismissAuthModalIfOpen(page)
  await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
  await page.getByPlaceholder(/命令 \/ 文件名|Command, file name/i).fill('协作')
  await page.getByRole('button', { name: /实时协作|Live collaboration/i }).click()
  await expect(page.locator('.modal--collab')).toBeVisible({ timeout: 15_000 })
}

/** Host creates a server-backed room (M1). Returns invite code. */
export async function createCollabRoomAsHost(page: Page): Promise<string> {
  await openCollabPanel(page)
  const modal = page.locator('.modal--collab')
  // Secondary "生成/创建房间" (btn-secondary) and primary footer action share the same label
  // when roomId is empty. Target the primary footer button (class on the element itself).
  await modal.getByTestId('collab-create-join-primary').click()
  await expect(page.locator('.modal--collab .collab-leave-btn')).toBeVisible({ timeout: 30_000 })
  const code = await page.getByTestId('collab-room-code').locator('strong').textContent()
  expect(code?.trim().length).toBeGreaterThanOrEqual(6)
  await closeCollabModal(page)
  return code!.trim()
}

export async function closeCollabModal(page: Page): Promise<void> {
  const modal = page.locator('.modal--collab')
  await modal.locator('.modal-close').click()
  await expect(modal).toBeHidden({ timeout: 15_000 })
}

export function collabStatusBar(page: Page) {
  return page.locator('.app-status-bar')
}

/** Role + signaling badges on the status bar (stable when collab modal is closed). */
export async function expectCollabStatusBarSession(
  page: Page,
  options: { role: RegExp; signaling?: boolean; roleTimeout?: number; signalingTimeout?: number },
): Promise<void> {
  const bar = collabStatusBar(page)
  const roleTimeout = options.roleTimeout ?? 45_000
  const signalingTimeout = options.signalingTimeout ?? 45_000
  await expect(bar.getByTestId('collab-role-badge')).toContainText(options.role, { timeout: roleTimeout })
  if (options.signaling !== false) {
    const badge = bar.getByTestId('collab-signaling-badge')
    await expect(badge).toBeVisible({ timeout: signalingTimeout })
    await expect(badge).toHaveText(/Livekit|WebRTC|y-webrtc/i)
  }
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
  await closeCollabModal(page)
}

export async function prepareFreshPage(page: Page, path = '/'): Promise<void> {
  await prepareE2EStorage(page)
  await page.goto(path)
  await waitForShellReady(page)
}
