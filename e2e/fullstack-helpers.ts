import { expect, type Page } from '@playwright/test'
import { registerAndLogin, uniqueCollabUser, waitForApiReady, type RegisteredUser } from './collab-helpers'

export { waitForApiReady, type RegisteredUser }

export function uniqueStackUser(prefix: string): RegisteredUser {
  return uniqueCollabUser(prefix)
}

export async function openWorkspaceManager(page: Page): Promise<void> {
  await page.getByRole('button', { name: /工作区管理|Workspaces/i }).click()
  const workspaceModal = page.locator('.wm-modal')
  await expect(workspaceModal.locator('.modal-title').filter({ hasText: /工作区管理|Workspaces/i })).toBeVisible({
    timeout: 15_000,
  })
}

export async function saveCurrentWorkspace(page: Page, workspaceName: string): Promise<void> {
  const workspaceModal = page.locator('.wm-modal')
  await workspaceModal.getByRole('button', { name: /保存当前工作区|Save current workspace/i }).click()

  const nameInput = workspaceModal.getByPlaceholder(/工作区名称|Workspace name/i)
  await nameInput.fill(workspaceName)

  const modalBody = workspaceModal.locator('.wm-body')
  await modalBody.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })

  const saveBtn = workspaceModal.locator('.wm-form-actions').getByRole('button', {
    name: /^(保存|Save)$/,
  })
  await expect(saveBtn).toBeEnabled({ timeout: 5_000 })
  await saveBtn.evaluate((btn) => (btn as HTMLButtonElement).click())
}

export async function expectWorkspaceSavedFlash(page: Page): Promise<void> {
  const workspaceModal = page.locator('.wm-modal')
  await expect(
    workspaceModal.locator('.wm-flash-row.alert-banner--success').filter({
      hasText: /工作区已保存|Workspace saved/i,
    }),
  ).toBeVisible({ timeout: 20_000 })
}

export async function expectCloudWorkspaceListed(page: Page, workspaceName: string): Promise<void> {
  const workspaceModal = page.locator('.wm-modal')
  await expect(workspaceModal.locator('.wm-state-panel--loading')).toHaveCount(0, { timeout: 30_000 })
  const cardTitle = workspaceModal.locator('.wm-list .wm-card-title').filter({ hasText: workspaceName })
  await expect(cardTitle).toBeVisible({ timeout: 30_000 })
  const cloudBadge = cardTitle.locator('.wm-badge--cloud').filter({ hasText: /云端|Cloud/i })
  await expect(async () => {
    if (await cloudBadge.isVisible()) return
    await page.waitForTimeout(500)
    throw new Error('cloud badge not visible yet')
  }).toPass({ timeout: 20_000 })
}

export async function registerLoginAndOpenWorkspace(page: Page, user: RegisteredUser): Promise<void> {
  await registerAndLogin(page, user)
  await openWorkspaceManager(page)
  await expect(page.locator('.wm-modal').getByText(/同步到云端|sync to cloud/i)).toBeVisible({
    timeout: 10_000,
  })
}
