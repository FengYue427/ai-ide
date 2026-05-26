# IDE-5-1 块级 Diff（v1.0.4）

> **目标**：Agent `write_file` 结果以 **变更块（hunk）** 预览，可逐块接受/拒绝，再写入工作区。  
> **默认安全**：`autoApplyWrites: false` 时仅预览，不直接落盘。

---

## 用户流程

1. 在 **设置 → 功能 → Agent** 中保持「自动应用写入」**关闭**（默认）。
2. 在 Chat 开启 **Agent 模式**，让模型调用 `write_file`。
3. 完成后底部出现 **N 个文件待预览** → 点击 **预览**。
4. 在 **Agent 变更预览** 弹窗中：
   - 左侧切换文件；修改过的文件显示 `{已选}/{总} 块`。
   - 上方勾选/取消 **变更块**（或「全选 / 全不选」）。
   - **应用已选块**：按当前勾选合并后写入。
   - **应用整文件**：忽略块选择，写入 Agent 建议的全文。
   - **跳过本文件**：不应用并从队列移除。
   - **应用全部**：对剩余文件按各自块选择合并后写入。

## 与 `autoApplyWrites` 的关系

| 设置 | 行为 |
|------|------|
| **关（默认）** | `write_file` 进入 Diff 队列；活动线显示 `· N 个变更块` |
| **开** | 直接写入工作区，不弹 Diff（适合信任全自动场景） |

## 技术锚点

| 模块 | 说明 |
|------|------|
| `diffHunkService.ts` | 行 diff、hunk 分组、`applyPartialDiff` |
| `agentApplyHunks.ts` | 多文件块选择、`resolveApplyContent` |
| `AgentApplyModal.tsx` | 预览 UI |
| `DiffViewer.tsx` | 块勾选 + 行级对比 |
| `agentRunner.ts` | `pendingChanges` + `hunkCount` 活动线 |

## 限制（v1.0.4）

- 行级 diff（非 AST）；相邻行改动可能合并为一块。
- 不做三向 merge / 冲突标记。
- 新建文件无「块」概念，仅全文应用。

## 验收（手测）

1. 修改同一文件两处不相邻代码 → 应出现 **2 个块**，取消一块后应用 → 仅一处生效。
2. 3 个文件 Agent 写入 → 预览 → **应用全部** → 三文件均按块选择落盘。
3. 活动线在 `write_file` 行显示块数量。

---

**下一版**：[ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md) § v1.0.5 Tab FIM
