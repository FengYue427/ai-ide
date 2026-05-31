# 当前执行入口

> **更新**：2026-05-29 — **v1.1.6 开波** · F1 编辑器内 diff

---

## 世代状态

| 线 | 状态 |
|----|------|
| **v1.1.5** | ✅ **GA** · tag `v1.1.5` · [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) |
| **v1.1.5.x** | ✅ **冻结**（1.1.5.1～1.1.5.5）· [ROADMAP_V1.1.5.x_PATCHES.md](./ROADMAP_V1.1.5.x_PATCHES.md) |
| **v1.1.6** | 🔄 **F1 规划** — Git 可视化 |
| **v1.1.7** | 📋 调试器 MVP |

---

## v1.1.6 入口

| 文档 | 用途 |
|------|------|
| [V1.1.6_KICKOFF.md](./V1.1.6_KICKOFF.md) | 开波 + 现状审计 |
| [V1.1.6_MASTER_PLAN.md](./V1.1.6_MASTER_PLAN.md) | F1～F6 主规划 |
| [V1.1.6_GA_EXECUTION.md](./V1.1.6_GA_EXECUTION.md) | DoD 勾选 |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | v1.1.7～9 |

---

## 当前任务（F1）

1. **Tab 模型**：`ideStore` / `EditorLayout` 支持 `git-diff` tab
2. **Monaco DiffEditor**：嵌入主编辑区，主题与 `Editor` 一致
3. **GitPanel**：「Diff」→ `openGitDiffTab(path)`（保留 modal 给 Agent）
4. **测试**：diff tab 打开 · `gitService.getFileDiff` 回归

代码锚点：`GitPanel.tsx` · `DiffViewer.tsx` · `EditorLayout.tsx` · `gitService.ts`

---

## 版本

开发期保持 **`1.1.5.5`**，F6 GA 时 bump **`1.1.6`** 并 tag。
