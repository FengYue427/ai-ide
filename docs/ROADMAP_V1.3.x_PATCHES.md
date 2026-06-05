# v1.3.x 补丁（轨道 A · 1.3.1 → 1.3.9）

> **前置**：v1.3.0 F1–F7 — [RELEASE_NOTES_v1.3.0.md](./RELEASE_NOTES_v1.3.0.md)  
> **策略**：**做到 v1.3.9 再顺理成章开 v1.4** · 零宣传、零上架  
> **主规划**：[V1.3.x_MASTER_PLAN.md](./V1.3.x_MASTER_PLAN.md)

---

## 定位

| 子版本 | 主题 | 文档 |
|--------|------|------|
| **v1.3.0** | F1–F7 大版本 | [V1.3_KICKOFF.md](./V1.3_KICKOFF.md) |
| **v1.3.1** ✅ | GA 收口 + CI/smoke | [V1.3.1_KICKOFF.md](./V1.3.1_KICKOFF.md) |
| **v1.3.2** ✅ | Tab · 断点 · 插件样例 | [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) |
| **v1.3.3** | Python + Agent 预算 + capped | [V1.3.3_KICKOFF.md](./V1.3.3_KICKOFF.md) |
| **v1.3.4** | 索引 2.0 可观测 | [V1.3.4_KICKOFF.md](./V1.3.4_KICKOFF.md) |
| **v1.3.5** ✅ | Tab 补全 II | [V1.3.5_KICKOFF.md](./V1.3.5_KICKOFF.md) |
| **v1.3.6** ✅ | 导航 II（TS + Python） | [V1.3.6_KICKOFF.md](./V1.3.6_KICKOFF.md) |
| **v1.3.7** | Agent/Chat 可靠性 | [V1.3.7_KICKOFF.md](./V1.3.7_KICKOFF.md) |
| **v1.3.8** | Git 轻抛光 · 插件/MCP | [V1.3.8_KICKOFF.md](./V1.3.8_KICKOFF.md) |
| **v1.3.9** | **世代收官** · v1.4 门 | [V1.3.9_KICKOFF.md](./V1.3.9_KICKOFF.md) |

**v1.4.0** 启动：`v1.3.9` tag + 生产 smoke **连续 2 周 5/5**。

---

## 各 patch 一句话

| 版本 | 北极星 | 关键验收 |
|------|--------|----------|
| **1.3.3** | F1/F5 生产可信 | `from lib.x import` F12 · Agent 索引不撑爆 payload |
| **1.3.4** | F2 看得见 | embedding hit/miss · 索引耗时/模式设置页可读 |
| **1.3.5** | F4 用起来 | Tab 设置可调 debounce · FIM 路径指标细分 |
| **1.3.6** | 语言服务加深 | Python Shift+F12 入门 · TS 引用列号 E2E 稳 |
| **1.3.7** | Agent 敢用 | @ 预检 + Agent payload 联动 · apply 失败可读 |
| **1.3.8** | 日常不切 VS Code | Git 状态刷新稳 · 插件 stack 文档/E2E |
| **1.3.9** | v1.3 句号 | smoke 周更 · 评分 ~3.3 · `V1.4_KICKOFF` |

---

## CI 门禁

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

---

## 综合分爬坡（估）

| 版本 | Δ | 累计 |
|------|:---:|:----:|
| 1.3.1 | +0.03 | ~3.10 |
| 1.3.2 | +0.05 | ~3.15 |
| 1.3.3 | +0.04 | ~3.19 |
| 1.3.4 | +0.03 | ~3.22 |
| 1.3.5 | +0.03 | ~3.25 |
| 1.3.6 | +0.04 | ~3.28 |
| 1.3.7 | +0.03 | ~3.30 |
| 1.3.8 | +0.02 | ~3.32 |
| **1.3.9** | +0.02 | **~3.28～3.32** |

距 **3.4 宣传线** 仍差 **v1.4**（设计如此）。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [V1.3.x_MASTER_PLAN.md](./V1.3.x_MASTER_PLAN.md) | 九 patch 总表与边界 |
| [V1.3.3_KICKOFF.md](./V1.3.3_KICKOFF.md) … [V1.3.9_KICKOFF.md](./V1.3.9_KICKOFF.md) | 各 patch 任务 |
| [V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md) | 周更 playbook |
| [ROADMAP_V1.3.md](./ROADMAP_V1.3.md) | 世代总览 |
