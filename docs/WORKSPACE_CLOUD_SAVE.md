# 工作区云端保存与 413 缓解（v1.1.3.9）

> **服务端限制**：见 `lib/api/workspacePayload.ts`（单文件 ≤200KB、≤200 文件、总 body ≤2MB）。

---

## 行为

| 层 | 行为 |
|----|------|
| **IndexedDB 自动保存** | 保留**完整**工作区（不裁剪） |
| **云端 PUT `/api/workspaces/:id`** | 保存前 `sanitizeWorkspaceFilesForCloud`：跳过二进制扩展名、超大单文件、超限数量；必要时再按 body 体积丢弃尾部文件 |
| **用户反馈** | 部分上传时 Toast（≤1 次/分钟）；413 时错误 Toast + 可行动文案 |

---

## 与协作并存

- Yjs `workspace-files` map 仍同步编辑器内文件；云端 autosave 裁剪**不影响**同房间实时协作。
- 超大文件应使用 `.gitignore` / 勿放入工作区，或依赖本地 autosave。

---

## 手测

1. 登录后打开含 `logo.png` + `index.ts` 的项目，等待 3s autosave。  
2. 预期：云端成功，`index.ts` 同步；Toast 提示跳过 1 个二进制。  
3. 单文件内容 >200KB：不上传该文件，本地仍可编辑。

---

## 相关

- [V1.1.4_MASTER_PLAN.md](./V1.1.4_MASTER_PLAN.md) F1 将继续深化大仓库策略。
