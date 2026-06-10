import { v4 as uuidv4 } from 'uuid'
import { getShareableAppOrigin } from '../lib/appOrigin'
import { readJsonResponse, apiFetch } from './apiUtils'

export interface ShareData {
  id: string
  files: { name: string; content: string; language: string }[]
  createdAt: number
  cloud?: boolean
}

export type ShareCreateResult = {
  id: string
  url: string
  cloud: boolean
}

export type ShareHistoryEntry = ShareData & {
  /** From cloud list API when local file bodies are not cached. */
  fileCount?: number
}

export function getShareFileCount(entry: ShareHistoryEntry): number {
  if (entry.files.length > 0) return entry.files.length
  return entry.fileCount ?? 0
}

const STORAGE_KEY = 'ai-ide-shared-projects'

export function generateShareId(): string {
  return uuidv4().slice(0, 8)
}

function persistLocalShare(shareData: ShareData): void {
  const existing = getAllShares()
  existing[shareData.id] = shareData
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function saveShare(data: Omit<ShareData, 'id' | 'createdAt'>): string {
  const id = generateShareId()
  const shareData: ShareData = {
    ...data,
    id,
    createdAt: Date.now(),
    cloud: false,
  }
  persistLocalShare(shareData)
  return id
}

export async function createShare(
  files: ShareData['files'],
): Promise<ShareCreateResult> {
  try {
    const response = await apiFetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ files }),
    })
    const data = await readJsonResponse<{
      share?: { slug?: string; createdAt?: string }
    }>(response)

    if (response.ok && data?.share?.slug) {
      const id = data.share.slug
      persistLocalShare({
        id,
        files,
        createdAt: data.share.createdAt ? Date.parse(data.share.createdAt) : Date.now(),
        cloud: true,
      })
      return { id, url: generateShareUrl(id), cloud: true }
    }
  } catch {
    // fall back to local-only snapshot
  }

  const id = saveShare({ files })
  return { id, url: generateShareUrl(id), cloud: false }
}

export function getShare(id: string): ShareData | null {
  const all = getAllShares()
  return all[id] || null
}

export async function loadShareById(id: string): Promise<ShareData | null> {
  const local = getShare(id)
  if (local) return local

  try {
    const response = await apiFetch(`/api/shares/${encodeURIComponent(id)}`)
    const data = await readJsonResponse<{
      share?: {
        slug?: string
        files?: ShareData['files']
        createdAt?: string
      }
    }>(response)

    if (!response.ok || !data?.share?.slug || !Array.isArray(data.share.files)) {
      return null
    }

    const shareData: ShareData = {
      id: data.share.slug,
      files: data.share.files,
      createdAt: data.share.createdAt ? Date.parse(data.share.createdAt) : Date.now(),
      cloud: true,
    }
    persistLocalShare(shareData)
    return shareData
  } catch {
    return null
  }
}

export async function listShareHistory(): Promise<ShareHistoryEntry[]> {
  const merged = new Map<string, ShareHistoryEntry>()
  for (const share of Object.values(getAllShares())) {
    merged.set(share.id, { ...share })
  }

  const cloud = await listCloudShareSummaries()
  for (const entry of cloud) {
    const existing = merged.get(entry.id)
    if (existing) {
      merged.set(entry.id, { ...existing, cloud: true, fileCount: entry.fileCount })
      continue
    }
    merged.set(entry.id, {
      id: entry.id,
      files: [],
      createdAt: entry.createdAt,
      cloud: true,
      fileCount: entry.fileCount,
    })
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export async function listCloudShareSummaries(): Promise<
  Array<{ id: string; fileCount: number; createdAt: number; cloud: true }>
> {
  try {
    const response = await apiFetch('/api/shares', { credentials: 'include' })
    const data = await readJsonResponse<{
      shares?: Array<{ slug?: string; fileCount?: number; createdAt?: string }>
    }>(response)
    if (!response.ok || !Array.isArray(data?.shares)) return []

    return data.shares
      .filter((entry) => Boolean(entry.slug))
      .map((entry) => ({
        id: entry.slug as string,
        fileCount: entry.fileCount ?? 0,
        createdAt: entry.createdAt ? Date.parse(entry.createdAt) : Date.now(),
        cloud: true as const,
      }))
  } catch {
    return []
  }
}

export async function deleteCloudShare(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/api/shares/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}

export function getAllShares(): Record<string, ShareData> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function deleteShare(id: string): void {
  const all = getAllShares()
  delete all[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export async function removeShare(id: string, cloud?: boolean): Promise<void> {
  deleteShare(id)
  if (cloud) {
    await deleteCloudShare(id)
  }
}

export function generateShareUrl(id: string): string {
  const origin = getShareableAppOrigin()
  if (origin) {
    return `${origin}/?share=${encodeURIComponent(id)}`
  }
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('share', id)
  return url.toString()
}

export function exportAsJson(files: { name: string; content: string }[]): string {
  return JSON.stringify({ files, exportedAt: new Date().toISOString() }, null, 2)
}

export function importFromJson(json: string): { name: string; content: string; language: string }[] | null {
  try {
    const data = JSON.parse(json)
    if (!data.files || !Array.isArray(data.files)) return null
    return data.files.map((f: { name?: string; content?: string; language?: string }) => ({
      name: f.name,
      content: f.content,
      language: f.language || getLanguageFromExt(f.name ?? ''),
    }))
  } catch {
    return null
  }
}

function getLanguageFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
  }
  return map[ext] || 'plaintext'
}
