# AI IDE 战略审阅（2026-06）

> 基于 v1.7.0 代码库审查 · 与 [AIDE_MASTER_PLAN.md](./AIDE_MASTER_PLAN.md) 对齐

## 产品现状（一句话）

开源、浏览器 + 桌面的 **多功能 AI 开发空间**；差异化在 **Intent OS 工程闭环**（Plan → Spec → 验收 → 证明包 → Share），而非 Tab/Agent 单点竞赛。

| 环境 | 状态 |
|------|------|
| 海外 Vercel | 已上线 · BYOK + 平台 AI · 付费 checkout 延后 |
| 国内阿里云 | 内测 IP 就绪 · **备案 + 支付宝 live 待完成** |
| 工程 | ~313 单测 + 41 E2E · entitlements 单一真相源 |

## 竞争格局（五条赛道）

1. **Chat-first IDE** — Cursor、Windsurf、Trae、Copilot（Tab/Agent/模型力主战场）  
2. **Vibe Builder** — Trae Builder、Bolt、v0（一句话全栈）  
3. **Spec-driven** — **我们**、Kiro（规格→验收→证明）  
4. **Terminal Agent** — Claude Code、Codex CLI  
5. **传统 IDE + 插件** — VS Code、JetBrains（生态碾压）

## 明确避开

- Tab/FIM 精度军备赛（vs Cursor）  
- Builder/SOLO + 免费模型补贴战（vs Trae）  
- 烧钱买量、公益 IDE 叙事  
- 全语言原生 LSP/调试器  
- 硬刚 VS Code 扩展生态  
- 协作 Beta 当 GA 主推  
- 宣传先于备案/支付闭环  

## 全力打造

1. **Intent OS 可感知交付物** — 证明包、Share 进度页、课设模板  
2. **国内 GA 闭环** — [CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)  
3. **付费 = 闭环能力**（非仅配额）— [SUBSCRIPTION_VALUE_ROADMAP.md](./SUBSCRIPTION_VALUE_ROADMAP.md)  
4. **Runtime 生产默认可用** — `VITE_AIDE_RUNTIME` + Activity Line  
5. **Team 独立价值** — 长链 Share、批量 Agent、**Share 进度关注**（Team 专属）  

## 目标用户

- 国内大学生 / 训练营（课设、竞赛、要证明）  
- 独立开发者（小项目、成本敏感）  
- 5 人以内小团队（Share + 轻协作）  

## 90 天节奏

| 阶段 | 重点 |
|------|------|
| Gate 0 | 备案 · 支付宝 · 域名 SSL |
| Sprint A | Runtime/UI 生产默认 · Team 功能差 · 文档同步 |
| GA | smoke 全绿 · ¥39/¥79 实付 |
| Sprint B | Share 邮件 · 转化数据 · 海外 checkout |

## 文档索引

- 总规划：[AIDE_MASTER_PLAN.md](./AIDE_MASTER_PLAN.md)  
- Intent OS：[INTENT_OS_ROADMAP.md](./INTENT_OS_ROADMAP.md)  
- 国内上线：[CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)  
- 订阅价值：[SUBSCRIPTION_VALUE_ROADMAP.md](./SUBSCRIPTION_VALUE_ROADMAP.md)  
