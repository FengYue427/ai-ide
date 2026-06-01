# ADR: v1.2 多根工作区

> **状态**：提议（Accepted for F1 implementation）  
> **日期**：2026-06-01

---

## 背景

`ideStore.files` 为扁平单根列表。Monorepo（`apps/web` + `packages/shared`）与「示例 + 用户项目」并排编辑需要 **多 `WorkspaceRoot`**。

---

## 决策

### 数据模型

```typescript
interface WorkspaceRoot {
  id: string           // uuid
  name: string         // 显示名，如 "frontend"
  files: FileItem[]
  autosaveKey: string  // IndexedDB key，默认 `autosave-${id}`
}

// ideStore
roots: WorkspaceRoot[]
activeRootId: string
// 便捷：activeFiles = roots.find(activeRootId).files
```

### 迁移

- 首次开启 `VITE_MULTI_ROOT`：将现有 `files` 包装为 `roots[0]`，`name` = `default`
- 关闭开关：仅暴露 `roots[0]`（开发回退）

### UI

- FileSidebar 顶栏：根下拉或 Tab
- ActivityBar「文件」仍切换侧栏；根选择在侧栏 header
- 编辑器 tab 带 `rootId`；切换根时可选关闭非当前根 tab

### 持久化

| 层 | 行为 |
|----|------|
| IndexedDB | 每根独立 `autosaveKey` |
| 云同步 | `saveWorkspace` payload 增加 `rootId`（API 后续扩展；2.0 可先仅本地多根） |

### 协作

- 房间创建/加入时 `ideStore.collaborationWorkspaceRootId` = 当前 `activeRootId`
- UI：`WorkspaceRootSwitcher` 在房间内禁用切换/增删，显示绑定根名称
- Viewer 不切换根；避免 Yjs 与第二根文件树分叉
- v1.2.0 协作场景建议单根

---

## 备选方案（未采用）

| 方案 | 原因 |
|------|------|
| 多窗口 | 浏览器标签成本高 |
| 单根多 folder 虚拟路径 | 与 Git/路径语义混乱 |

---

## 后果

- `setFiles` / `useWorkspacePersistence` 需接受 `rootId`
- E2E 增加「切换根」用例
- v1.2.2 SSH 可将远程目录挂载为新 `WorkspaceRoot`
