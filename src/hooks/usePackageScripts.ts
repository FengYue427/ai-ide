import { useMemo } from 'react'
import { collectPackageScriptSources, parsePackageScripts, type PackageScript } from '../services/packageJsonService'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore } from '../store/ideStore'

export function usePackageScripts(): PackageScript[] {
  const files = useIDEStore((s) => s.files)

  return useMemo(() => {
    const sources = collectPackageScriptSources(
      files.map((file) => ({ name: file.name, content: file.content })),
      workspaceContextService.getAllFiles(),
    )
    return parsePackageScripts(sources)
  }, [files])
}
