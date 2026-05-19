import { unifiedStorage } from './unifiedStorage'
import type { PluginPackage } from './pluginService'

const STORAGE_KEY = 'plugins-installed'

export async function loadInstalledPluginPackages(): Promise<PluginPackage[]> {
  return unifiedStorage.get<PluginPackage[]>(STORAGE_KEY, [])
}

export async function saveInstalledPluginPackages(packages: PluginPackage[]): Promise<void> {
  await unifiedStorage.set(STORAGE_KEY, packages)
}
