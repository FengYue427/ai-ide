/** Client flag — desktop .env.electron defaults to false (Pro ¥39 · Team ¥79, same as web). */

export function isPublicWelfareClient(): boolean {
  return import.meta.env.VITE_PUBLIC_WELFARE === 'true'
}
