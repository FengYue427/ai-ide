# 当前执行清单

> **规划**：[PLAN_SHORT_V1.0.3-V1.0.4.md](./PLAN_SHORT_V1.0.3-V1.0.4.md)（短）· [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)（长）  
> **1.0.3.x**：**1.0.3.4 已发** ✅ · **1.0.4**：⏳ Kickoff 待启动

---

## A. 短规划 — 阶段 A（1.0.3.x 收口，优先）

见 [PLAN_SHORT_V1.0.3-V1.0.4.md](./PLAN_SHORT_V1.0.3-V1.0.4.md) §2。

- [x] tag **`v1.0.3.4`** 已推送
- [ ] `npm run rc:live-spotcheck` → `version=1.0.3.4`
- [ ] 人工 5 项 · 对账 1 轮 · 发布 ≥2 渠道
- [ ] 关闭 **1.0.3.x** milestone
- [ ] **可选** `v1.0.3` GA + `VITE_GA_LIVE=true` → [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)

---

## B. 短规划 — 阶段 B/C（1.0.4 + 1.0.4.x）

| 下一步 | 文档 |
|--------|------|
| 起草 `V1.0.4_MASTER_PLAN` + Kickoff | [PLAN_SHORT](./PLAN_SHORT_V1.0.3-V1.0.4.md) §3～4 |
| 四级附属表 | [ROADMAP_V1.0.4.x.md](./ROADMAP_V1.0.4.x.md) |

**目标分**：2.75 → **~2.80**（1.0.4.4 收官）

---

## C. 长远规划 — v1.1（1.0.4.x 之后）

见 [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)：

- P1 后台 Agent 队列  
- P2 协作 M1  
- P3 AI 网关（可选）  
- P4 i18n Phase 2  

**目标分**：**~2.90**（v1.1.0 GA）

---

## 命令速查

```powershell
npm run ops:verify-p1
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
npm run billing:verify-cron
```
