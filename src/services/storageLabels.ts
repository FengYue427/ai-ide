import { serviceText } from '../lib/serviceI18n'

/** Local IndexedDB project name for editor autosave snapshot. */
export function getAutosaveProjectName(): string {
  return serviceText('workspace.autosave.project')
}
