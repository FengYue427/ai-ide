import { FolderPlus, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { isMultiRootWorkspaceEnabled } from '../lib/v12Features'
import { MAX_WORKSPACE_ROOTS } from '../lib/workspaceRoots'
import { useIDEStore } from '../store/ideStore'

export function WorkspaceRootSwitcher() {
  const { t } = useI18n()
  const multiRoot = isMultiRootWorkspaceEnabled()
  const workspaceRoots = useIDEStore((s) => s.workspaceRoots)
  const activeRootId = useIDEStore((s) => s.activeRootId)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationWorkspaceRootId = useIDEStore((s) => s.collaborationWorkspaceRootId)
  const setActiveWorkspaceRoot = useIDEStore((s) => s.setActiveWorkspaceRoot)
  const addWorkspaceRoot = useIDEStore((s) => s.addWorkspaceRoot)
  const removeWorkspaceRoot = useIDEStore((s) => s.removeWorkspaceRoot)
  const renameWorkspaceRoot = useIDEStore((s) => s.renameWorkspaceRoot)

  if (!multiRoot || workspaceRoots.length === 0) return null

  const collabLocked = Boolean(collaborationRoomId)
  const canAdd = !collabLocked && workspaceRoots.length < MAX_WORKSPACE_ROOTS

  return (
    <div className="workspace-root-switcher" data-testid="workspace-root-switcher">
      <label className="workspace-root-switcher__label" htmlFor="workspace-root-select">
        {t('workspaceRoot.label')}
      </label>
      <div className="workspace-root-switcher__row">
        <select
          id="workspace-root-select"
          className="workspace-root-switcher__select"
          value={activeRootId}
          disabled={collabLocked}
          onChange={(event) => setActiveWorkspaceRoot(event.target.value)}
          aria-label={t('workspaceRoot.label')}
        >
          {workspaceRoots.map((root) => (
            <option key={root.id} value={root.id}>
              {root.name} ({root.files.length})
            </option>
          ))}
        </select>
        {canAdd ? (
          <button
            type="button"
            className="workspace-root-switcher__icon-btn"
            title={t('workspaceRoot.add')}
            aria-label={t('workspaceRoot.add')}
            onClick={() => addWorkspaceRoot()}
          >
            <FolderPlus size={14} />
          </button>
        ) : null}
        {workspaceRoots.length > 1 && !collabLocked ? (
          <button
            type="button"
            className="workspace-root-switcher__icon-btn workspace-root-switcher__icon-btn--danger"
            title={t('workspaceRoot.remove')}
            aria-label={t('workspaceRoot.remove')}
            onClick={() => removeWorkspaceRoot(activeRootId)}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      {!collabLocked ? (
        <input
          type="text"
          className="workspace-root-switcher__rename"
          value={workspaceRoots.find((r) => r.id === activeRootId)?.name ?? ''}
          onChange={(event) => renameWorkspaceRoot(activeRootId, event.target.value)}
          aria-label={t('workspaceRoot.rename')}
          maxLength={48}
        />
      ) : (
        <p className="workspace-root-switcher__hint">
          {t('workspaceRoot.collabBound', {
            name:
              workspaceRoots.find((r) => r.id === collaborationWorkspaceRootId)?.name ??
              collaborationWorkspaceRootId ??
              'default',
          })}
        </p>
      )}
    </div>
  )
}
