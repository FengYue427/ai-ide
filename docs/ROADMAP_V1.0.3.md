# 主版本路线图 — v1.0.3（大规划）

> **前置**：完成 [ROADMAP_V1.0.2.x.md](./ROADMAP_V1.0.2.x.md) 中 **1.0.2.1～1.0.2.7** 附属交付后，再启动本主版本。  
> **版本策略**：[VERSIONING.md](./VERSIONING.md)

---

## 定位

**1.0.3** 不是「又一个小补丁」，而是在 **1.0.2 GA + 全套 1.0.2.x** 之后的 **对外主版本升级**：

- 竞品综合分目标 **~2.75+**（复评并更新对比文档）
- 1.0.2 世代 **产品/运营封板**（README、发布矩阵、法务、Sentry/Cron 常态化）
- 为 **v1.1**（后台 Agent、协作 M1 等）清债

---

## 目标清单（草案）

| ID | 交付 | 验收 |
|----|------|------|
| M3-1 | 竞品复评 + `COMPETITOR_COMPARISON` 升版 | 分数与 1.0.2.x 实态一致 |
| M3-2 | GitHub Release **v1.0.3** + 公告 | 含 Web + 双平台桌面（若 1.0.2.7 未完成则并入） |
| M3-3 | 自定义域名 + `APP_URL` 全链路 | 支付回调、桌面壳 URL |
| M3-4 | 微信 live **决策记录**（接 or 文档说明仅支付宝） | 法务可查 |
| M3-5 | `go-live:preflight` + 72h 运维 SOP 写入 [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) | 一键门禁 |
| M3-6 | 对外叙事：从「1.0.2 公测 GA」升级为「1.0.3 稳定版」 | 掘金/知乎等可引用 |

---

## 非目标（留 v1.1+）

- 全量 Cursor Tab++ / Background Agent  
- Kiro Hooks / VSIX 生态

---

## 与 1.0.2.7 的分工

| 内容 | 建议归属 |
|------|----------|
| macOS 桌面包 | **1.0.2.7**（可提前） |
| 自定义域名、竞品封板、发布公告 | **1.0.3** |
| Tab FIM / 索引 / Diff / grep | **1.0.2.3～1.0.2.5** |

若 1.0.2.7 已交付 macOS，1.0.3 聚焦 **运营 + 评分 + 域名 + 品牌**。

---

## 验收

```powershell
npm run go-live:preflight
npm run test:e2e -- --project=ui   # 若 UI 有变
```

**下一世代**：[PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md) → v1.1.0
