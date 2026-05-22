# 当前执行清单（2026-05）

> **战略**：RC 阶段 **赛道 A（可上市 SaaS）优先** — [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md)  
> **评估结论**：[LAUNCH_ASSESSMENT_2026-05.md](./LAUNCH_ASSESSMENT_2026-05.md) — **可 RC 公测公告，不可 D2/D3 正式上架**

---

## Phase 1 回顾（已完成）

| 项 | 状态 |
|----|------|
| i18n Phase 1（batch 6～16） | ✅ |
| P0'-1 代码门禁（batch 17～18，集成 22/22） | ✅ |
| P1 路径 A + 路径 B 骨架 | ✅ |
| P4-1 首包（batch 19） | ✅ |

---

## Phase 2 — D2 MLP 冲刺（当前，约 3～4 周）

**目标**：生产 `health` 绿 + 人工验收 + 法务 → 对外 **D2 公测 SaaS**（仍不收款，路径 A）。

### P0' 部署闭环（W1，阻塞一切）

| 顺序 | ID | 任务 | 退出标准 | 状态 |
|------|-----|------|----------|------|
| 1 | **P2-1** | 修复 Vercel `DATABASE_URL` | `smoke:production` **5/5**；`health` 为 `ok` + `database=connected` | ⬜ **运维** — 见 [VERCEL_ENV_PHASE2.md](./VERCEL_ENV_PHASE2.md) |
| 2 | P2-2 | `npm run deploy:check` | 全绿并记入 DEPLOY_CHECKLIST | ⬜ |
| 3 | P2-3 | `prisma migrate deploy` 生产 | schema 与 Neon 一致 | ⬜ |
| 4 | P2-4 | 核对 `AUTH_SECRET`、`APP_URL`、Cookie 域 | 同上清单 | ⬜ |

```powershell
# W1 验收命令
cd c:\Users\18663\IDE\ai-ide
npm run p0:gate
npm run mlp:preflight
$env:APP_URL='https://ai-ide-flame.vercel.app'
npm run smoke:production
npm run deploy:check
```

**Vercel 环境变量最低集**：`DATABASE_URL`（Neon pooler + `sslmode=require`）、`AUTH_SECRET`（≥32 字符随机）、`APP_URL`（与部署域一致，无尾斜杠）。

### 验收与合规（W2）

| ID | 任务 | 状态 |
|----|------|------|
| P2-5 | 人工 30min：[AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) 注册→云工作区→AI | ⬜ |
| P2-6 | 法务审阅 `public/legal/*.html` | ⏸️ **最后做**（模板已就绪） |
| P2-7 | 可选 `VITE_SENTRY_DSN` | ⬜ |
| P2-8 | Git remote：轮换 PAT → SSH | ⬜ |
| P2-9 | 英文 UI：[I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md) 生产跑一遍 | ⬜ |

### 体验加固（W3，可与 W1 后期并行）

| ID | 任务 | 状态 |
|----|------|------|
| P2-10 | 索引截断 UI 提示 | ✅ batch 20 — Chat 区显示 indexed/eligible |
| P2-11 | API 5xx toast | ✅ batch 20 — `useApiErrorFeedback` |
| P2-12 | 找回密码隐藏（无 SMTP） | ✅ batch 20 — `VITE_ENABLE_PASSWORD_RESET` |
| P2-13 | `mlp:preflight` CI | ✅ batch 20 — `workflow_dispatch` job |

### 对外 RC（W4）

| ID | 任务 | 状态 |
|----|------|------|
| P2-14 | README + CHANGELOG：RC 公测、BYOK、云账号前提 | ⬜ |
| P2-15 | 更新 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) 档位为 D2 已达标 | ⬜ |
| P2-16 | 竞品分复评（目标仍 ≥2.2，属长期） | ⬜ |

---

## Phase 3 — 产品深度（D2 通过后）

| 优先级 | ID | 说明 | 前置 |
|--------|-----|------|------|
| 1 | P4-1 续 | 向量分片、增量 embedding、索引 UI | Phase 2 完成 |
| 2 | P4-4 | Tab 补全防抖/缓存 | 同上 |
| 3 | P4-2 / P4-5 | LSP POC **或** 协作 M1 | 二选一 |

---

## 暂不启动

| 项 | 原因 |
|----|------|
| P1 路径 B+ 生产收款 | 无商户 |
| D3 可收款 GA | 依赖 Phase 2 + 商户 |
| P4-7 Electron | 非 RC blocker |
| 平台 AI 网关 | PLAN 搁置 |

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [LAUNCH_ASSESSMENT_2026-05.md](./LAUNCH_ASSESSMENT_2026-05.md) | 上市判定总结 |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | L1～L24 门禁 |
| [P0_P1_STATUS.md](./P0_P1_STATUS.md) | P0'/P1 技术 |
| [P4-1_INDEXING.md](./P4-1_INDEXING.md) | 索引首包 |
| [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) | 12 周总规划 |
