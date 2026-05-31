# Electron Git CLI spike (v1.1.6.8)

## Scope

When **AI IDE Desktop** has a **local project folder** bound (`getElectronRootPath()`):

1. Try **`git status --porcelain=v1 -z`**, **`git branch --show-current`**, **`git branch --format=…`** via main-process spawn.
2. Parse porcelain in renderer (`parseGitPorcelain.ts`).
3. On any failure → fall back to **isomorphic-git** on WebContainer FS (unchanged path).

## Read-only

This spike is **status + branch list only**. Commit, stage, diff, and history still use isomorphic-git / WebContainer unless noted otherwise.

## Limits

| Topic | Note |
|-------|------|
| **PATH** | `git` must be on system PATH (Windows: Git for Windows install). |
| **No git** | IPC returns `GIT_STATUS_FAILED` → isomorphic fallback. |
| **Not a repo** | `NOT_A_GIT_REPO` → fallback. |
| **Unsaved buffers** | CLI reads **on-disk** tree; editor-only changes may lag until written to disk. |
| **Toggle** | Git panel → “Use native git for status”; stored in `git-desktop-cli-enabled` (default on). |

## IPC

- `desktop:git-readonly-snapshot` → `{ ok, statusPorcelain, branch, branches }` or `{ ok: false, reason, detail? }`
- Preload: `readGitReadonlySnapshot(rootPath)`

## Files

- `electron/gitCli.mjs`
- `src/lib/parseGitPorcelain.ts`
- `src/services/desktopGitReadonly.ts`
- `src/lib/gitReadonlySnapshot.ts`
