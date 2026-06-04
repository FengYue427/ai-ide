import { expect, type Page } from '@playwright/test'

/** Matches default ideStore seed so bootstrap skips the welcome overlay. */
export const E2E_DEFAULT_FILES = [
  {
    name: 'index.js',
    content: '// 欢迎使用 AI IDE\nconsole.log("Hello World!");',
    language: 'javascript',
  },
]

/** Seed IndexedDB before navigation so first-time welcome does not cover the toolbar. */
/** Pretend a logged-in user so toolbar billing CTA is visible in static preview. */
export async function prepareLoggedInUser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const session = {
      user: { id: 'e2e-user', email: 'e2e@ai-ide.test', name: 'E2E' },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    localStorage.setItem('ai-ide:user', JSON.stringify(session))
  })
}

export async function prepareE2EStorage(page: Page): Promise<void> {
  await page.addInitScript((files) => {
    const openDb = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('ai-ide-db', 1)
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings')
          }
        }
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('settings', 'readwrite')
          tx.objectStore('settings').put(files, 'autosave-default')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      })

    void openDb()
  }, E2E_DEFAULT_FILES)
}

export async function dismissAuthModalIfOpen(page: Page): Promise<void> {
  const overlay = page.locator('.auth-modal-overlay')
  if ((await overlay.count()) === 0) return
  await page.locator('.auth-close-btn').click({ timeout: 5_000 })
  await expect(overlay).toHaveCount(0, { timeout: 5_000 })
}

export async function waitForShellReady(page: Page): Promise<void> {
  const loading = page.locator('#loading-screen')
  if (await loading.count()) {
    await loading.waitFor({ state: 'detached', timeout: 30_000 })
  }
  await expect(page.locator('.toolbar-title')).toHaveText('AI IDE', { timeout: 30_000 })
  await dismissAuthModalIfOpen(page)
  await expect(page.locator('.welcome-screen')).toHaveCount(0, { timeout: 15_000 })
}

export async function gotoApp(page: Page, path = '/'): Promise<void> {
  await prepareE2EStorage(page)
  await page.goto(path)
  await waitForShellReady(page)
}
