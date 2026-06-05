# v1.4.x 补丁（轨道 A · 1.4.1 → 1.4.9）

> **前置**：v1.4.0 F1–F7 — [RELEASE_NOTES_v1.4.0.md](./RELEASE_NOTES_v1.4.0.md)  
> **策略**：**做到 v1.4.9 再顺理成章开 v1.5** · 零宣传 · 零上架  
> **主规划**：[V1.4.x_MASTER_PLAN.md](./V1.4.x_MASTER_PLAN.md)  
> **战略转向**：[V1.5_STRATEGY_PIVOT.md](./V1.5_STRATEGY_PIVOT.md)

---

## 定位

| 子版本 | 主题 | 文档 |
|--------|------|------|
| **v1.4.0** | F1–F7 大版本 | [V1.4_KICKOFF.md](./V1.4_KICKOFF.md) |
| **v1.4.1** ✅ | GA 收口 · E2E · v1.4 竞品复评 | [V1.4.1_KICKOFF.md](./V1.4.1_KICKOFF.md) |
| **v1.4.2** ✅ | Tab++ 技术 RFC | [V1.4.2_KICKOFF.md](./V1.4.2_KICKOFF.md) |
| **v1.4.3** ✅ | Tab++ spike（多行 ghost POC） | [V1.4.3_KICKOFF.md](./V1.4.3_KICKOFF.md) |
| **v1.4.4** ✅ | AIDE Runtime RFC · ADR | [V1.4.4_KICKOFF.md](./V1.4.4_KICKOFF.md) |
| **v1.4.5** ✅ | hooks.yaml schema · 设置预览 | [V1.4.5_KICKOFF.md](./V1.4.5_KICKOFF.md) |
| **v1.4.6** ✅ | Tab++ 深化 I（FIM middle · 指标 UX） | [V1.4.6_KICKOFF.md](./V1.4.6_KICKOFF.md) |
| **v1.4.7** ✅ | Runtime 深化 I（Spec 目录 · runtime-state 草案） | [V1.4.7_KICKOFF.md](./V1.4.7_KICKOFF.md) |
| **v1.4.8** ✅ | Activity Line RFC · orchestrator stub | [V1.4.8_KICKOFF.md](./V1.4.8_KICKOFF.md) |
| **v1.4.9** ✅ | **世代收官** · v1.5 门 | [V1.4.9_KICKOFF.md](./V1.4.9_KICKOFF.md) |

**v1.5.0** 启动：`v1.4.9` tag + 生产 smoke **连续 2 周 5/5** + `V1.5_KICKOFF` 评审。

---

## 各 patch 一句话

| 版本 | 北极星 | 关键验收 |
|------|--------|----------|
| **1.4.1** | v1.4 基线可信 | E2E 44/44 UI 绿 · `COMPETITOR_SCORE_V1.4` · 712 单测 |
| **1.4.2** | Tab++ 可开工 | `V1.5_F1_TAB_PLUS_PLUS.md` 评审通过 |
| **1.4.3** | Tab++ 看得见 | 多行 ghost POC（特性开关，非生产默认） |
| **1.4.4** | Runtime 可开工 | `AIDE_RUNTIME.md` v0.1 · `ADR_V1.5_AIDE_RUNTIME` |
| **1.4.5** | Spec 工件可校验 | `hooksSchema.ts` 单测 · 设置页 YAML 预览 |
| **1.4.6** | Tab 敢日用 | FIM `middle` 段 · P95 设置可读 · debounce 抛光 |
| **1.4.7** | Spec 工程可浏览 | Spec 目录增强 · `runtime-state` 类型草案 |
| **1.4.8** | Agent 可感知（草案） | Activity Line 线框 · `runtimeOrchestrator` 接口 stub |
| **1.4.9** | v1.4 句号 | smoke 周更 · 评分 ~3.42 · `V1.5_KICKOFF` 定稿 |

---

## v1.4.x 全程禁止（留给 v1.5.0）

- Tab++ **生产 env 默认全开**（1.4.3 仅 spike）
- `hookRunner` **生产执行**（1.4.5 仅 schema）
- `runtimeOrchestrator` **真实排水**（1.4.8 仅 stub）
- Activity Line **生产 UI 默认展示**
- VSIX · SSH · SSO · 支付生产化
- **任何宣传 / 上架**

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
| 1.4.0 | — | ~3.35～3.40 |
| 1.4.1 | +0.02 | ~3.37 |
| 1.4.2 | +0.01 | ~3.38 |
| 1.4.3 | +0.02 | ~3.39 |
| 1.4.4 | +0.01 | ~3.40 |
| 1.4.5 | +0.02 | ~3.41 |
| 1.4.6 | +0.02 | ~3.42 |
| 1.4.7 | +0.01 | ~3.43 |
| 1.4.8 | +0.01 | ~3.43 |
| **1.4.9** | +0.02 | **~3.40～3.44** |

距 **v1.5 体验线 ≥3.50** 仍差 **v1.5.0 F1–F8**（设计如此）。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [V1.4.x_MASTER_PLAN.md](./V1.4.x_MASTER_PLAN.md) | 九 patch 总表与边界 |
| [V1.4.1_KICKOFF.md](./V1.4.1_KICKOFF.md) · [V1.4.9_KICKOFF.md](./V1.4.9_KICKOFF.md) | 首/末 patch |
| [V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md) | 周更 playbook（沿用） |
| [ROADMAP_V1.5.md](./ROADMAP_V1.5.md) | 下一世代大版本 |
