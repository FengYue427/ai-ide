/** Client flag — set VITE_PUBLIC_WELFARE=true at build time (see .env.electron / Vercel). */

export function isPublicWelfareClient(): boolean {
  return import.meta.env.VITE_PUBLIC_WELFARE === 'true'
}
