# Phase 2 执行状态

> 法务（P2-6）**最后做**。更新日期：2026-05-22。

## 总览

| 类别 | 完成 | 待办 |
|------|:----:|:----:|
| 代码/文档（batch 20～21） | 12 | 2 |
| 运维（Vercel/Neon） | 0 | 4 |
| 人工验收 | 0 | 2 |
| 法务 | 0 | 1（最后） |

## 代码与文档 ✅

| ID | 项 | 批次 |
|----|-----|------|
| P2-10 | 索引 N/M 提示 | 20 |
| P2-11 | API 5xx toast | 20 |
| P2-12 | 隐藏找回密码 | 20 |
| P2-13 | CI `mlp:preflight` dispatch | 20 |
| P2-14 | README + CHANGELOG RC | 21 |
| — | 欢迎页云端健康横幅 | 21 |
| — | `npm run smoke:report` | 21 |
| — | [VERCEL_ENV_PHASE2.md](./VERCEL_ENV_PHASE2.md) | 20 |

## 运维阻塞 ⬜

| ID | 项 | 最近探测 |
|----|-----|----------|
| P2-1 | `DATABASE_URL` 等 | `health: degraded`, `database: unavailable` |
| P2-2 | `deploy:check` | 依赖 P2-1 |
| P2-3 | `prisma migrate deploy` | — |
| P2-4 | AUTH_SECRET / APP_URL | — |

```powershell
npm run smoke:report
# 或
$env:APP_URL='https://ai-ide-flame.vercel.app'; npm run smoke:production
```

## 验收 ⬜

| ID | 项 |
|----|-----|
| P2-5 | 人工 30min — [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) |
| P2-9 | 生产英文冒烟 — [I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md) |
| P2-7 | 可选 Sentry — [OBSERVABILITY.md](./OBSERVABILITY.md) |
| P2-8 | Git remote PAT 轮换 |

## 法务（最后）⏸️

| ID | 项 |
|----|-----|
| P2-6 | 审阅 `public/legal/*.html` |

## D2 签字条件

1. `smoke:production` **5/5**
2. P2-5 记录完成
3. P2-6 法务完成
4. 更新 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) 档位（P2-15）
