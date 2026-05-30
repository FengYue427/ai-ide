# 工作区限制审计（v1.1.4 F1）

> **代码源**：`lib/api/workspacePayload.ts` · **客户端**：`authService.saveWorkspace` / `sanitizeWorkspaceFilesForCloud`

---

## 1. 服务端硬限制

| 项 | 值 | HTTP |
|----|-----|------|
| 请求 body 上限 | 2 MB | 413 `api.body.tooLarge` |
| 单 `files` 字段字符串 | 2 MB | 413 |
| 文件数量 | 200 | 413 `api.workspace.fileCountExceeded` |
| 单文件内容 | 200 KB | 413 `api.workspace.fileContentTooLarge` |
| 文件名长度 | 200 字符 | 400 |

---

## 2. 客户端云端裁剪（1.1.3.9+，F1 深化）

| 规则 | 行为 |
|------|------|
| 二进制扩展名 | `.png` `.zip` `.pdf` 等 → **不上传** |
| 单文件 >200KB | **不上传** |
| 文件数 >200 | 保留前 200 个 eligible |
| body 仍超限 | 从尾部再丢弃直至 ≤2MB |
| IndexedDB autosave | **不裁剪**（完整副本） |
| Yjs 协作 | **不裁剪**（房间内同步编辑器状态） |

---

## 3. 索引 / UI 限制（已有）

| 项 | 浏览器 | 桌面 |
|----|--------|------|
| 索引文件上限 | `MAX_INDEX_FILES` | `MAX_INDEX_FILES_DESKTOP` |
| 工具栏 / 侧栏 | `WorkspaceCapacityBanner` warn/full | 同左 |

见 `src/lib/indexLimits.ts`、`src/services/workspaceLimits.ts`。

---

## 4. F1 待办

| # | 项 | 优先级 |
|---|-----|:------:|
| 1 | 工作区管理器保存前 **云端预览** | P0 ✅ kickoff |
| 2 | 大文件树 **默认折叠**（≥250 文件） | P0 ✅ kickoff |
| 3 | 分块上传 / 压缩 | P2 → v1.1.4.2 |
| 4 | 万级文件虚拟列表 | P1 → F2 后期 |

---

## 5. 手测清单

| # | 步骤 | 预期 | 记录 |
|---|------|------|:----:|
| 1 | 登录 + 300+ 小文件项目 | 侧栏折叠 hint；索引 tier warn/full | ☐ |
| 2 | 含 `logo.png` + `app.ts` 保存到云端 | 预览 1/N；Toast 跳过二进制 | ☐ |
| 3 | 单文件 250KB | 不上传；本地 autosave 仍在 | ☐ |
| 4 | 协作中编辑大工作区 | Yjs 仍同步 | ☐ |
