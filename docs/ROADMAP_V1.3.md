# v1.3 规划（B 轨 · 语言 + 索引 + Agent）

> **更新**：2026-06-05  
> **状态**：✅ **v1.3.x 收官（v1.3.9 GA）**  
> **Patch 主规划**：[V1.3.x_MASTER_PLAN.md](./V1.3.x_MASTER_PLAN.md) · [ROADMAP_V1.3.x_PATCHES.md](./ROADMAP_V1.3.x_PATCHES.md)  
> **下一世代**：[ROADMAP_V1.4.md](./ROADMAP_V1.4.md)  
> **前置**：[ROADMAP_V1.2.md](./ROADMAP_V1.2.md)（v1.2.0～v1.2.9 ✅）

---

## 1. 定位

v1.3 为 v1.2 世代之后的 **产品深度 II**。**patch 线 1.3.1～1.3.9 已全部交付**，顺理成章开 **v1.4**（待 smoke 2 周绿）。

| 子版本 | 主题 |
|--------|------|
| **v1.3.0** ✅ | F1–F7 大版本 |
| **v1.3.1** ✅ | GA 收口 |
| **v1.3.2** ✅ | Tab · 断点 · 插件样例 |
| **v1.3.3** ✅ | Python + Agent 预算 |
| **v1.3.4** ✅ | 索引 2.0 可观测 |
| **v1.3.5** ✅ | Tab II |
| **v1.3.6** ✅ | 导航 II |
| **v1.3.7** ✅ | Agent/Chat 可靠 |
| **v1.3.8** ✅ | Git 轻抛光 · 插件/MCP |
| **v1.3.9** ✅ | **收官** · v1.4 门 |

---

## 2. v1.3.0 能力表

| 主题 | 说明 |
|------|------|
| Python 导航 | F12 / 大纲 — F1 |
| 索引 2.0 | embedding 持久化 + 遥测 — F2 |
| Agent 索引上下文 | F5 |
| Tab / 插件 / 平台 | F4 · F6 · F7 |
| 搁置至 v1.4+ | SSH · SSO · VSIX · 全量 LSP · Tab P95 · 2k 索引 · Git 完整面板 |

---

## 3. 启动 v1.4 条件

- [x] v1.3.9 tag
- [ ] 生产 smoke 连续 **2 周** 5/5（见 [V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md)）
- [x] `V1.4_KICKOFF.md` 起草完成（Z4）
- [ ] CI `test:e2e` + `test:e2e:stack` 绿（发版后持续）

---

## 4. 收官评分

综合 **~3.28～3.32** — [COMPETITOR_SCORE_V1.3.9.md](./COMPETITOR_SCORE_V1.3.9.md)  
**仍 &lt; 3.4**（设计如此，v1.4 填坑目标）

---

## 5. 文档索引

| 文档 | 用途 |
|------|------|
| [V1.3.x_MASTER_PLAN.md](./V1.3.x_MASTER_PLAN.md) | 1.3.1～1.3.9 总表 |
| [RELEASE_NOTES_v1.3.9.md](./RELEASE_NOTES_v1.3.9.md) | 世代收官说明 |
| [V1.4_KICKOFF.md](./V1.4_KICKOFF.md) | 下一世代入口 |
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前工程入口 |
| [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md) | 差距跟踪 |
