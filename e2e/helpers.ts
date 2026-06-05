import { expect, type Page } from '@playwright/test'

/** Matches default ideStore seed so bootstrap skips the welcome overlay. */
export const E2E_DEFAULT_FILES = [
  {
    name: 'index.js',
    content: '// 欢迎使用 AI IDE\nconsole.log("Hello World!");',
    language: 'javascript',
  },
]

/** Cross-file TS navigation (v1.2.7 F1): main imports lib/greet. */
export const E2E_NAV_FILES = [
  {
    name: 'main.ts',
    content: "import { greet } from './lib/greet'\n\nexport function run() {\n  return greet()\n}\n",
    language: 'typescript',
  },
  {
    name: 'lib/greet.ts',
    content: 'export function greet(): number {\n  return 42\n}\n',
    language: 'typescript',
  },
]

/** Cross-file Python navigation (v1.3 F1). */
export const E2E_NAV_PYTHON_FILES = [
  {
    name: 'main.py',
    content: "from lib.util import greet\n\ndef run():\n    return greet()\n",
    language: 'python',
  },
  {
    name: 'lib/util.py',
    content: 'def greet():\n    return 42\n',
    language: 'python',
  },
]

/** TS sample for symbol outline + language navigation E2E (v1.2.5 F1). */
export const E2E_SYMBOL_FILES = [
  {
    name: 'sample.ts',
    content: 'export function greet() {\n  return 1\n}\n\nexport class App {\n  run() {\n    return greet()\n  }\n}\n',
    language: 'typescript',
  },
]

export type E2ESeedFile = { name: string; content: string; language: string }

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

export async function prepareE2EStorage(page: Page, files: E2ESeedFile[] = E2E_DEFAULT_FILES): Promise<void> {
  await page.addInitScript((seedFiles) => {
    localStorage.setItem('ai-ide:e2e-harness', '1')
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
          tx.objectStore('settings').put(seedFiles, 'autosave-default')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      })

    void openDb()
  }, files)
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

/** Toolbar settings — avoids status bar duplicate「设置」button. */
export async function openSettingsFromToolbar(page: Page): Promise<void> {
  await page.locator('header.toolbar').getByRole('button', { name: /^(Settings|设置)$/ }).click()
  await expect(page.locator('.settings-dialog')).toBeVisible({ timeout: 10_000 })
}

/** Settings sidebar tab (label includes description in a11y name — use test id). */
export async function openSettingsTab(
  page: Page,
  tabId: 'ai' | 'appearance' | 'editor' | 'features' | 'advanced',
): Promise<void> {
  await openSettingsFromToolbar(page)
  await page.getByTestId(`settings-tab-${tabId}`).click()
}
