# 主版本路线图 — v1.0.3

> **状态**：**Kickoff 进行中**（2026-05-26）  
> **完整大规划**：[V1.0.3_MASTER_PLAN.md](./V1.0.3_MASTER_PLAN.md)  
> **执行清单**：[V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)  
> **前置**：[ROADMAP_V1.0.2.x.md](./ROADMAP_V1.0.2.x.md) **1.0.2.7** ✅

---

## 定位

**1.0.3** = 1.0.2 世代 **对外主版本升级**（运营 + 品牌 + 双平台封板），**不是**功能大爆炸。

| 维度 | 1.0.2.x | **1.0.3** |
|------|---------|-----------|
| 版本号 | 第四段附属 | 第三段主版本 |
| 叙事 | GA + 补丁 | **稳定版** |
| 竞品分 | 2.55 → **2.75** | 对外发布 + live 复测 |
| 桌面 | Win；macOS @ 1.0.2.7 | 双平台 Release 同 tag |

---

## 目标清单

| ID | 交付 | 验收 |
|----|------|------|
| M3-1 | 竞品复评 **2.75+** | [COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md) |
| M3-2 | GitHub Release **v1.0.3** | Web + Win + Mac |
| M3-3 | 自定义域名 + `APP_URL` 全链路 | [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) |
| M3-4 | 微信 live 决策记录 | Issue / docs |
| M3-5 | `go-live:preflight` + 72h SOP | [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) |
| M3-6 | 对外「稳定版」公告 | publish/ |

---

## 非目标 → v1.1+

Background Agent · Cascade 全感知 · Kiro Hooks · VSIX · DAP 调试

---

## 时间线（4～6 周）

见 Master Plan §4 Gantt：**Kickoff → 运维 → RC → GA → 72h**

---

## 验收

```powershell
npm run go-live:preflight
git tag v1.0.3 && git push origin v1.0.3
```

**下一世代**：v1.1.0 — [V1.0.3_MASTER_PLAN.md](./V1.0.3_MASTER_PLAN.md) §6
