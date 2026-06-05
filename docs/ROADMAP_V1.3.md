# v1.3 规划（B 轨 · 语言 + 索引 + Agent）

> **更新**：2026-06-05  
> **状态**：🔨 **v1.3.1 待 tag**（代码就绪 · CI 门禁确认中）  
> **Kickoff**：[V1.3_KICKOFF.md](./V1.3_KICKOFF.md) · **Patch**：[ROADMAP_V1.3.x_PATCHES.md](./ROADMAP_V1.3.x_PATCHES.md)  
> **前置**：[ROADMAP_V1.2.md](./ROADMAP_V1.2.md)（v1.2.0～v1.2.9 ✅）

---

## 1. 定位

v1.3 为 v1.2 世代之后的 **产品深度 II**：从「TS 导航 + 工程 polish」升级到 **多语言入门 + 仓库理解 + Agent 可依赖**。

| 子版本 | 主题 |
|--------|------|
| **v1.3.0** ✅ | F1–F7：Python · 索引2.0 · Agent · Tab · 插件 · 平台 — [RELEASE_NOTES_v1.3.0.md](./RELEASE_NOTES_v1.3.0.md) |
| **v1.3.1** 🔨 | GA 收口 · smoke 1.3.x — [V1.3.1_GA_EXECUTION.md](./V1.3.1_GA_EXECUTION.md) |
| **v1.3.2** ⏳ | Tab 抛光 · 条件断点 · 插件样例 — [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) |

轨道 A：**v1.3.x** patch（热修 + 日用抛光），详见 [ROADMAP_V1.3.x_PATCHES.md](./ROADMAP_V1.3.x_PATCHES.md)。

---

## 2. v1.3.0 能力表（目标）

| 主题 | 说明 |
|------|------|
| Python LSP | F12 / 大纲 / ADR — 见 [V1.3_MASTER_PLAN.md](./V1.3_MASTER_PLAN.md) F1 |
| 索引 2.0 | 增量 + embedding 缓存 |
| 后台 Agent | 生产策略 + E2E + 演示脚本 |
| 搁置 | SSH · SSO · VSIX |

---

## 3. v1.2.x 收口

| 版本 | 状态 |
|------|:----:|
| v1.2.0～v1.2.8 | ✅ |
| **v1.2.9** | ✅ [RELEASE_NOTES_v1.2.9.md](./RELEASE_NOTES_v1.2.9.md) |

---

## 4. 启动条件

- [x] v1.2.9 GA · tag `v1.2.9`
- [x] v1.3.0 F1–F7 代码
- [ ] v1.3.1：CI E2E + stack 全绿 · smoke 5/5
- [ ] v1.3.2 GA → v1.4 启动

---

## 5. 文档索引

| 文档 | 用途 |
|------|------|
| [V1.3_KICKOFF.md](./V1.3_KICKOFF.md) | 北极星与阶段 |
| [V1.3_MASTER_PLAN.md](./V1.3_MASTER_PLAN.md) | 任务与验收 |
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前工程入口 |
| [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md) | 竞品差距跟踪 |
