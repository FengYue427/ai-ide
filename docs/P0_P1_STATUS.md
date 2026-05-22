# P0' / P1 执行状态（2026-05）

> 一口气完成「上市门禁 + 商业化骨架」后的验收记录。

---

## P0' — 上市门禁

| ID | 项 | 状态 | 验证 |
|----|-----|------|------|
| P0'-1 | 集成测试 | ✅ | `npm run test:integration:local`（21+ 离线 4） |
| P0'-2 | 部署冒烟 | 🔶 脚本就绪 | 推送后执行 `APP_URL=https://你的域名 npm run smoke:production`（曾见 API 500，需 Vercel env 对齐） |
| P0'-3 | E2E CI | ✅ | CI `test:e2e`；本地 `npm run test:e2e:local`（12/12） |
| P0'-4 | Cookie / APP_URL | 🔶 文档 | [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) §2 |
| P0'-5 | 离线登录策略 | ✅ | S0-3b + `allowOfflineAuthFallback()` |
| P0'-6 | 安全基线 | ✅ | `npm run p0:gate` 含 `security-baseline.mjs` |

**一键门禁**：`npm run p0:gate`  
**发版前**：`npm run mlp:preflight`（p0:gate + build + smoke 产物）

### 工程修复（本轮）

- `scripts/load-env-local.mjs`：`run-integration-local` 继承 `.env.local` 的 `DATABASE_URL`
- `integration-api-offline`：未登录订阅返回 free plan（与 API 一致）
- `billingMode`：未设置 `NODE_ENV` 时允许 dev payment simulate（本地 dev:api）
- 欢迎页链接：`/help/browser-limits.html`
- `formatFetchError`：统一网络错误文案

---

## P1 — 商业化

| 路径 | 状态 | 说明 |
|------|------|------|
| **A 公测不收款** | ✅ | `billingPath` + `BETA_BILLING_NOTE`；订阅按钮「公测免费」 |
| **B 收款骨架** | ✅ 代码 | checkout / 支付宝·微信 notify / `PaymentOrder`；集成测 dev simulate + order GET |
| **B+ 生产商户** | ⬜ | 需商户与 `verify-env --require-cn-billing` |

**路径判定**：`GET /api/subscription/payment-methods` → `billingPath`: `A` | `B` | `dev`

**接收款前**：对外保持 RC/公测，运行 `npm run billing:preflight`（有商户时）。

---

## P0/P1 安全加固（2026-05 续）

见 [P0_P1_SECURITY_2026-05.md](./P0_P1_SECURITY_2026-05.md) — 插件沙箱/终端、用量 fail-closed、dev_mock 双禁、设置能力说明。

---

## 仍未完成（不阻塞 P0'/P1 代码）

| 项 | 说明 |
|----|------|
| D2 MLP 法务审阅 | 替换 legal 模板正文 |
| Sentry 生产 DSN | 可选 `VITE_SENTRY_DSN` |
| 生产人工 30min | 注册→云工作区→AI 对话 |
| git remote PAT | 建议改 SSH / 轮换 token |

---

## 相关文档

- [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) — D2/D3 档位
- [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) — P4 产品深度
- [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) — 手工 QA
