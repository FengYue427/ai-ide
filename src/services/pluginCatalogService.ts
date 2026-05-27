import helloPluginExample from '../../examples/hello.plugin.json'
import workspaceHintsPlugin from '../../examples/plugins/workspace-hints.plugin.json'
import jsonFormatterPlugin from '../../examples/plugins/json-formatter.plugin.json'
import todoScannerPlugin from '../../examples/plugins/todo-scanner.plugin.json'
import lineCounterPlugin from '../../examples/plugins/line-counter.plugin.json'
import mdPreviewPlusPlugin from '../../examples/plugins/md-preview-plus.plugin.json'
import type { PluginPackage } from './pluginService'
import { pluginManager } from './pluginService'
import { workspaceError } from './workspaceErrors'
import { loadInstalledPluginPackages, saveInstalledPluginPackages } from './pluginStorage'

export interface PluginCatalogEntry {
  id: string
  name: string
  version: string
  description: string
  author: string
  tags: string[]
  permissions: string[]
  /** Curated score 1–5 for market display (v1.0.6.3). */
  rating: number
  package: PluginPackage
}

function entryFromPackage(
  pkg: PluginPackage,
  meta: { tags: string[]; rating: number; author?: string },
): PluginCatalogEntry {
  return {
    id: pkg.manifest.id,
    name: pkg.manifest.name,
    version: pkg.manifest.version,
    description: pkg.manifest.description,
    author: meta.author ?? pkg.manifest.author ?? 'AI IDE',
    tags: meta.tags,
    permissions: pkg.manifest.permissions,
    rating: meta.rating,
    package: pkg,
  }
}

export const PLUGIN_CATALOG: PluginCatalogEntry[] = [
  entryFromPackage(helloPluginExample as PluginPackage, { tags: ['demo', 'ui'], rating: 4.2 }),
  entryFromPackage(workspaceHintsPlugin as PluginPackage, { tags: ['tools', 'ui'], rating: 4.0 }),
  entryFromPackage(jsonFormatterPlugin as PluginPackage, { tags: ['tools', 'formatter'], rating: 4.8 }),
  entryFromPackage(todoScannerPlugin as PluginPackage, { tags: ['tools', 'productivity'], rating: 4.6 }),
  entryFromPackage(lineCounterPlugin as PluginPackage, { tags: ['tools', 'productivity'], rating: 4.3 }),
  entryFromPackage(mdPreviewPlusPlugin as PluginPackage, { tags: ['tools', 'markdown', 'ui'], rating: 4.5 }),
]

export const PLUGIN_CATALOG_TAGS = Array.from(new Set(PLUGIN_CATALOG.flatMap((e) => e.tags))).sort()

export function getCatalogEntry(id: string): PluginCatalogEntry | undefined {
  return PLUGIN_CATALOG.find((entry) => entry.id === id)
}

export function isPluginInstalled(pluginId: string, installedIds: Iterable<string>): boolean {
  return new Set(installedIds).has(pluginId)
}

/** Install a curated catalog package (bypasses loadPlugin JSON paste gate in production). */
export async function installCatalogEntry(
  entryId: string,
): Promise<{ ok: boolean; error?: string }> {
  const entry = getCatalogEntry(entryId)
  if (!entry) return { ok: false, error: workspaceError('plugin.catalog.notFound') }

  const result = pluginManager.registerPackage(entry.package)
  if (!result.ok) return { ok: false, error: result.error }

  try {
    const packages = await loadInstalledPluginPackages()
    const without = packages.filter((item) => item.manifest.id !== entry.id)
    without.push(entry.package)
    await saveInstalledPluginPackages(without)
  } catch {
    return { ok: false, error: workspaceError('plugin.catalog.storageFailed') }
  }

  return { ok: true }
}
