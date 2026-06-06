const STORAGE_KEY = 'ai-ide:spec-hooks-guide-v157'

export function shouldShowSpecHooksGuide(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== '1'
}

export function dismissSpecHooksGuide(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, '1')
}
