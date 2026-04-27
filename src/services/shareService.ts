import { v4 as uuidv4 } from 'uuid'

export interface ShareData {
  id: string
  files: { name: string; content: string; language: string }[]
  createdAt: number
}

const STORAGE_KEY = 'ai-ide-shared-projects'

export function generateShareId(): string {
  return uuidv4().slice(0, 8)
}

export function saveShare(data: Omit<ShareData, 'id' | 'createdAt'>): string {
  const id = generateShareId()
  const shareData: ShareData = {
    ...data,
    id,
    createdAt: Date.now()
  }
  
  const existing = getAllShares()
  existing[id] = shareData
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  
  return id
}

export function getShare(id: string): ShareData | null {
  const all = getAllShares()
  return all[id] || null
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

export function generateShareUrl(id: string): string {
  return `${window.location.origin}?share=${id}`
}

export function exportAsJson(files: { name: string; content: string }[]): string {
  return JSON.stringify({ files, exportedAt: new Date().toISOString() }, null, 2)
}

export function importFromJson(json: string): { name: string; content: string; language: string }[] | null {
  try {
    const data = JSON.parse(json)
    if (!data.files || !Array.isArray(data.files)) return null
    return data.files.map((f: any) => ({
      name: f.name,
      content: f.content,
      language: f.language || getLanguageFromExt(f.name)
    }))
  } catch {
    return null
  }
}

function getLanguageFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript',
    tsx: 'typescript', py: 'python', html: 'html',
    css: 'css', json: 'json', md: 'markdown'
  }
  return map[ext] || 'plaintext'
}
