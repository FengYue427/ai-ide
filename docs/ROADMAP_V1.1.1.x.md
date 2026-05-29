# v1.1.1.x 计划系统稳定化（GA 前附属补丁）

> **原则**：在 **v1.1.1 GA** 正式发包/部署前完成；**不单独部署**到生产，与 GA 包一并发布。  
> **前置**：v1.1.0.14～0.20 功能已本地就绪（见 [ROADMAP_V1.1.0_PLAN_SYSTEM.md](./ROADMAP_V1.1.0_PLAN_SYSTEM.md)）。  
> **GA 清单**：[V1.1.1_GA_EXECUTION.md](./V1.1.1_GA_EXECUTION.md)（构思稿，GA 前补齐）

---

## 版本映射（原 1.1.0.21～0.23）

| 附属版 | 原 patch | 主题 |
|--------|----------|------|
| **v1.1.1.1** | 0.21 | 队列 UI 性能（长队列预览、面板抽离减重渲染） |
| **v1.1.1.2** | 0.22 | 队列持久化 schema 版本 + 迁移 + 损坏降级 |
| **v1.1.1.3** | 0.23 | Plans / Specs / Reports / 任务队列 i18n（zh-CN + en-US） |

---

## v1.1.1.1 — 队列 UI 性能

- **用户故事**：50+ 步队列时设置/Chat 仍流畅，预览可展开查看全部。
- **实现**：
  - `TaskQueuePanel` 从 `ChatPanel` 抽离并 `memo`
  - `QueuePreviewList`：默认展示前 5 条，可展开
- **验收**：人工入队 30 条后滚动 Chat，输入不卡顿；展开/收起预览正常

---

## v1.1.1.2 — 持久化健壮性

- **用户故事**：刷新后队列可恢复；localStorage 被改坏时不白屏，并提示已清空。
- **实现**：
  - `queuePersistenceCore`：`{ v: 1, items }` 信封；兼容旧版纯数组
  - `load*Detailed()` 返回 `{ items, corrupted, migrated }`
- **验收**：单测覆盖迁移/损坏；损坏时 Chat  toast + 空队列

---

## v1.1.1.3 — i18n

- **用户故事**：切换 en-US 后，计划/Spec/报告/任务队列相关 UI 为英文。
- **实现**：`translations.ts` 增加 `plan.*` / `spec.*` / `report.*` / `queue.*`；各 Section + `TaskQueuePanel` 使用 `useI18n`
- **验收**：`npm run test:local`；设置语言 en-US 后上述区块无硬编码中文

---

## v1.1.1.4 — 计划步骤手动完成（功能）

- **用户故事**：不跑 Chat 也能把已完成步骤勾掉（`- [ ]` → `- [x]`）。
- **实现**：`PlansSection`「标记完成」；`markPlanStepDone` 批量写回 plan 文件。
- **验收**：选 2 步 → 标记完成 → 打开 plan 见勾选。

## v1.1.1.5 — 溯源可跳转（功能）

- **用户故事**：从计划步骤跳到对应 Spec tasks；从 Spec 跳回来源计划。
- **实现**：`findSpecTasksPathForPlanStep` / `listPlanLinksForSpec`；Plans/Specs 目录按钮跳转。
- **验收**：映射后双向打开正确文件。

## v1.1.1.6 — .aide 同步到工作区索引（功能）

- **用户故事**：编辑器里有 `.aide/plans` 但 AI 索引只有 welcome 文件时，一键把 `.aide/**` 纳入工作区上下文。
- **实现**：`aideWorkspaceSyncService`；计划总览「同步 .aide 到工作区索引」。
- **验收**：同步后 `workspaceContext` 含 plan/spec 路径；@ 与语义检索可见。

---

## v1.1.1.7 — 复制计划（功能）

- **用户故事**：在现有计划基础上快速分叉一份新计划文件。
- **实现**：`planDuplicateService`；PlansSection「复制计划」。
- **验收**：复制后新文件路径不同、标题带 copy、内容一致。

## v1.1.1.8 — 报告恢复预览（功能）

- **用户故事**：从报告恢复队列前先看到将入队的 Plan/Spec 列表，再确认。
- **实现**：`queueReportRestorePreviewService`；ReportsSection 内联预览 + 确认；直接「恢复」走确认弹窗。
- **验收**：预览条数与入队一致；取消则不改变队列。

---

## v1.1.1.9 — GA 文档与版本收口（无新 IDE 功能）

- **交付**：
  - [V1.1.1_GA_EXECUTION.md](./V1.1.1_GA_EXECUTION.md)
  - [PLAN_SYSTEM_QUICKSTART.md](./PLAN_SYSTEM_QUICKSTART.md)
  - `README.md` / `CHANGELOG [1.1.1]` 收束
  - `package.json` → **1.1.1**（对外 GA 版本号）
  - 可选 [publish 稿](./publish/XIAOHONGSHU_POST_2026-05-28_V1.1.1_PLAN_SYSTEM_GA.md)
- **验收**：DoD 表可勾选；`npm run test:local` 全绿

---

## v1.1.1.9 — GA 文档与版本收口

- **状态**：✅ 本地完成（`package.json` **1.1.1**、README、CHANGELOG `[1.1.1]`、Quickstart、GA 清单）
- **待发**：`git tag v1.1.1`、生产 smoke、首次 push/deploy（用户确认）

---

## 执行顺序

```
v1.1.1.1 → … → v1.1.1.8 → v1.1.1.9（文档）→ tag v1.1.1 + 首次部署
```

| 段 | 性质 |
|----|------|
| **1.1.1.1～1.1.1.3** | 稳定化（性能 / 持久化 / i18n） |
| **1.1.1.4～1.1.1.6** | **功能**（手动完成 / 溯源跳转 / .aide 同步） |

**工程版本**：开发期 `package.json` 随附属版递增；**远程部署**仅在 v1.1.1 GA 时进行。
