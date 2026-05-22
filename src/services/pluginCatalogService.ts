import helloPluginExample from '../../examples/hello.plugin.json'
import workspaceHintsPlugin from '../../examples/plugins/workspace-hints.plugin.json'
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
  package: PluginPackage
}

export const PLUGIN_CATALOG: PluginCatalogEntry[] = [
  {
    id: helloPluginExample.manifest.id,
    name: helloPluginExample.manifest.name,
    version: helloPluginExample.manifest.version,
    description: helloPluginExample.manifest.description,
    author: 'AI IDE',
    tags: ['demo', 'ui'],
    permissions: helloPluginExample.manifest.permissions,
    package: helloPluginExample as PluginPackage,
  },
  {
    id: workspaceHintsPlugin.manifest.id,
    name: workspaceHintsPlugin.manifest.name,
    version: workspaceHintsPlugin.manifest.version,
    description: workspaceHintsPlugin.manifest.description,
    author: workspaceHintsPlugin.manifest.author ?? 'AI IDE',
    tags: ['tools', 'ui'],
    permissions: workspaceHintsPlugin.manifest.permissions,
    package: workspaceHintsPlugin as PluginPackage,
  },
]

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
