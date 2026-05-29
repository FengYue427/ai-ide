interface FileLike {
  name: string
  content: string
  language?: string
}

export const PLAN_SPEC_LINKS_PATH = '.aide/meta/plan-spec-links.json'

export interface PlanSpecLink {
  planPath: string
  planStepText: string
  planStepLine?: number
  specTasksPath: string
  specTaskText: string
  createdAt: string
}

interface LinkStorePayload {
  links: PlanSpecLink[]
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function keyOf(link: Pick<PlanSpecLink, 'planPath' | 'planStepText' | 'specTasksPath' | 'specTaskText'>): string {
  return `${link.planPath}::${normalize(link.planStepText)}::${link.specTasksPath}::${normalize(link.specTaskText)}`
}

export function readPlanSpecLinks(files: FileLike[]): PlanSpecLink[] {
  const file = files.find((item) => item.name === PLAN_SPEC_LINKS_PATH)
  if (!file) return []
  try {
    const parsed = JSON.parse(file.content) as LinkStorePayload
    if (!Array.isArray(parsed.links)) return []
    return parsed.links.filter(
      (item) =>
        !!item &&
        typeof item.planPath === 'string' &&
        typeof item.planStepText === 'string' &&
        typeof item.specTasksPath === 'string' &&
        typeof item.specTaskText === 'string',
    )
  } catch {
    return []
  }
}

export function upsertPlanSpecLinksFile<T extends FileLike>(
  files: T[],
  incoming: Array<Pick<PlanSpecLink, 'planPath' | 'planStepText' | 'planStepLine' | 'specTasksPath' | 'specTaskText'>>,
  now = new Date(),
): T[] {
  if (incoming.length === 0) return files
  const current = readPlanSpecLinks(files)
  const seen = new Set(current.map((link) => keyOf(link)))
  const nextLinks = [...current]
  for (const item of incoming) {
    const key = keyOf(item)
    if (seen.has(key)) continue
    seen.add(key)
    nextLinks.push({
      ...item,
      createdAt: now.toISOString(),
    })
  }
  const content = `${JSON.stringify({ links: nextLinks }, null, 2)}\n`
  const index = files.findIndex((item) => item.name === PLAN_SPEC_LINKS_PATH)
  if (index < 0) {
    return [...files, { name: PLAN_SPEC_LINKS_PATH, content, language: 'json' } as T]
  }
  return files.map((item, i) => (i === index ? ({ ...item, content, language: 'json' } as T) : item))
}

export function buildPlanLinkCountMap(links: PlanSpecLink[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const link of links) {
    const key = `${link.planPath}::${normalize(link.planStepText)}`
    map[key] = (map[key] ?? 0) + 1
  }
  return map
}

export function findSpecTasksPathForPlanStep(
  links: PlanSpecLink[],
  planPath: string,
  stepText: string,
): string | null {
  const normalized = normalize(stepText)
  const match = links.find((link) => link.planPath === planPath && normalize(link.planStepText) === normalized)
  return match?.specTasksPath ?? null
}

export function listPlanLinksForSpec(links: PlanSpecLink[], specTasksPath: string): PlanSpecLink[] {
  const seen = new Set<string>()
  const rows: PlanSpecLink[] = []
  for (const link of links) {
    if (link.specTasksPath !== specTasksPath) continue
    const key = `${link.planPath}::${normalize(link.planStepText)}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(link)
  }
  return rows
}

export function summarizeSpecSources(links: PlanSpecLink[], specTasksPath: string, maxItems = 2): string[] {
  const rows = links.filter((link) => link.specTasksPath === specTasksPath)
  const seen = new Set<string>()
  const summary: string[] = []
  for (const row of rows) {
    const key = `${row.planPath}::${normalize(row.planStepText)}`
    if (seen.has(key)) continue
    seen.add(key)
    summary.push(`${row.planPath}: ${row.planStepText}`)
    if (summary.length >= maxItems) break
  }
  return summary
}
