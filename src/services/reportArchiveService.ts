import type { ReportCatalogItem } from './reportCatalogService'
import { sortReportCatalog } from './reportCatalogService'

interface FileLike {
  name: string
  content: string
}

export function pickReportPathsToPrune(items: ReportCatalogItem[], keepRecent: number): string[] {
  const keep = Math.max(0, Math.floor(keepRecent))
  if (items.length === 0 || keep <= 0) return sortReportCatalog(items, 'recent').map((item) => item.path)
  const sorted = sortReportCatalog(items, 'recent')
  if (sorted.length <= keep) return []
  return sorted.slice(keep).map((item) => item.path)
}

export function removeReportsFromFiles<T extends FileLike>(files: T[], paths: string[]): T[] {
  if (paths.length === 0) return files
  const pathSet = new Set(paths)
  return files.filter((file) => !pathSet.has(file.name))
}

export async function buildReportsZipBlob(files: FileLike[], paths: string[]): Promise<Blob> {
  const pathSet = new Set(paths)
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  let count = 0
  for (const file of files) {
    if (!pathSet.has(file.name)) continue
    const normalized = file.name.replace(/\\/g, '/')
    zip.file(normalized, file.content)
    count += 1
  }
  if (count === 0) {
    throw new Error('没有可导出的报告文件')
  }
  return zip.generateAsync({ type: 'blob' })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
