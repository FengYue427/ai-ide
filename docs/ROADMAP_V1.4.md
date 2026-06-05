# v1.4 规划（B 轨 · 基础填坑 · 冲 3.4）

> **更新**：2026-06-05  
> **状态**：📋 **草案**（v1.3.9 内起草；编码待启动条件满足）  
> **Kickoff**：[V1.4_KICKOFF.md](./V1.4_KICKOFF.md)  
> **前置**：[ROADMAP_V1.3.md](./ROADMAP_V1.3.md)（v1.3.0～v1.3.9 ✅）

---

## 1. 定位

v1.4 为 v1.3 世代之后的 **基础填坑 I**：把 patch 线刻意搁置的生产级能力（Tab P95、大仓索引、Git 面板、桌面壳、后台 Agent）做成 **可运营默认可用**，综合分目标 **≥3.35 → 3.4**。

| 子版本 | 主题 |
|--------|------|
| **v1.4.0** | F1–F7 大版本 |
| **v1.4.x** | （编码启动后再规划 patch 线） |

---

## 2. v1.4.0 能力表（骨架）

| 主题 | 说明 | 阶段 |
|------|------|------|
| Tab/FIM 生产级 | P95 可测 · 生产默认策略 | F1 |
| 大仓索引 | 2k Worker · 分片重建 | F2 |
| Git 完整面板 | status 矩阵 · hunk stage | F3 |
| 桌面壳 | Electron 默认路径改版 | F4 |
| 后台 Agent | 生产 API + 默认可开 | F5 |
| MCP/插件 | 官方目录 · KB 深化 | F6 |
| 平台 GA | v14Features · E2E · 文档 | F7 |
| 搁置至 v1.5+ | SSH · SSO · VSIX · 全量 LSP |

---

## 3. 启动条件

- [x] v1.3.9 tag
- [ ] 生产 smoke 连续 **2 周** 5/5 — [V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md)
- [ ] CI E2E 绿（42 UI + 2 stack）
- [x] `V1.4_KICKOFF.md` 起草（Z4）

---

## 4. 评分目标

| 时期 | AI IDE 目标 | 说明 |
|------|-------------|------|
| v1.3.9 收官 | **~3.28～3.32** | 已达成（见 [COMPETITOR_SCORE_V1.3.9.md](./COMPETITOR_SCORE_V1.3.9.md)） |
| v1.4 中期 | ~3.32～3.36 | F1–F4 交付后复评 |
| **v1.4 GA** | **≥3.35 → 3.4** | 再评估宣传线 |

---

## 5. 文档索引

| 文档 | 用途 |
|------|------|
| [V1.4_KICKOFF.md](./V1.4_KICKOFF.md) | F1–F7 阶段表 |
| [V1.3.x_MASTER_PLAN.md](./V1.3.x_MASTER_PLAN.md) | v1.3 边界与收官 |
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前工程入口 |
| [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md) | 差距跟踪 |
