# 当前执行清单（2026-05）

> **战略**：RC 阶段 **赛道 A（可上市 SaaS）优先** — 见 [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) §1。  
> **刚完成**：Phase 1 国际化 P0～P4（batch 16）— [I18N_STATUS.md](./I18N_STATUS.md)。

---

## 本周优先（W1～W2 · P0'）

| 顺序 | ID | 任务 | 负责人动作 | 状态 |
|------|-----|------|------------|------|
| 1 | P0'-1 | `npm run p0:gate` 全绿 | ✅ batch 18（集成 22/22 + security-baseline） | ✅ |
| 2 | P0'-2 | 生产冒烟 | `APP_URL=https://ai-ide-flame.vercel.app npm run smoke:production` | 🔶 需可访问 Vercel |
| 3 | P0'-2b | `npm run deploy:check` | 与冒烟同一 URL，记入 DEPLOY_CHECKLIST | ⬜ |
| 4 | P0'-4 | 生产 30min 人工 | 注册 → 云工作区 → AI 对话 — [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) | ⬜ |
| 5 | L12 | 法务审阅 | 中英模板页 + 欢迎页按语言链接；正式运营前法务签字 | 🔶 模板就绪 |
| 6 | L11 | Git remote | 轮换嵌入 PAT → SSH / 凭据管理器 | ⬜ |
| 7 | L21 | Sentry（可选） | Vercel 设 `VITE_SENTRY_DSN` — 代码已接 `sentryInit.ts` | ⬜ |

**一键命令**：

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run p0:gate
npm run mlp:preflight
$env:APP_URL='https://ai-ide-flame.vercel.app'; npm run smoke:production
```

---

## 已决策 · 暂不启动

| 项 | 原因 |
|----|------|
| P1 路径 B+ 生产收款 | 无商户；对外保持 **RC / 公测**（路径 A ✅） |
| P4-7 Electron | 仅评估文档，非 RC blocker |
| 平台 AI 网关 | PLAN 明确搁置 |

---

## W3～W4（P1 决策 + 加固）

- 书面确认：6 周内是否接支付宝/微信/Stripe **生产**商户
- 若无商户：更新对外文案，不宣传「可订阅」
- 若有沙箱：跑 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) + `npm run billing:preflight`

---

## W7+（A 稳定后 · 赛道 B 片段）

按 RICE 建议顺序启动 **P4 产品深度**（与 [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) §4 一致）：

| 优先级 | ID |  initiative | 首包交付建议 |
|--------|-----|-------------|--------------|
| 1 | P4-1 | 代码库理解 | 大仓 `.gitignore` 与索引上限统一；向量检索错误文案 + 设置开关说明 |
| 2 | P4-4 | Tab 补全 | 防抖/缓存降延迟（5～8 人日） |
| 3 | P4-2 | 语言服务 | TS/JS LSP 代理 POC（可选 wasm） |
| 4 | P4-5 / P4-6 | 协作 M1 **或** 插件 M2 远程目录 | 二选一并行，避免双线拉扯 |

**P4-1 开工前检查**：`p0:gate` 绿 + 生产 health 200。

---

## 档位目标

| 档位 | 目标时间 | 前置 |
|------|----------|------|
| **D2 MLP** | +3～4 周 | P0' 全绿 + L12 法务 |
| **D3 可收款** | +6～10 周 | P1 路径 B+ 商户 |
| 竞品分 ≥ 2.2 | 与 P4-1 同步 | [COMPETITIVE_BENCHMARK_2026.md](./COMPETITIVE_BENCHMARK_2026.md) |

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 本文件 — 当前 sprint |
| [P0_P1_STATUS.md](./P0_P1_STATUS.md) | P0'/P1 验收表 |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | D2/D3 门禁 |
| [I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md) | 英文 UI 冒烟 |
| [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) | 12 周排期 |
