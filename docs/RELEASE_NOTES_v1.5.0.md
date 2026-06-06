# Release Notes — v1.5.0 平台模型 · Tab++ · AIDE Runtime

> **日期**：2026-06-05 · **前置**：v1.4.9

## F0 — 平台模型网关

- 多厂商平台路由：OpenAI · Anthropic · Gemini · DeepSeek · Qwen · GLM · MiniMax
- **弃 BYOK**（Ollama 本地保留）；`VITE_ALLOW_BYOK_LEGACY=false`
- 模型 **加权配额**；Free 限 economy 档
- 套餐调价：Pro **$9.99/¥39** · Team **$19.99/¥79**
- E2E：`platform-models.spec.ts`

## F1 — Tab++ Core

- 多行 ghost 补全（`VITE_TAB_PLUS_PLUS`）
- FIM `prefix/middle/suffix` 路径
- 生产目标：P95 &lt;400ms · debounce 250ms · ≤8 行

## F2 — Tab++ Context

- 打开文件 + 最近编辑 + Spec 活跃 task 注入 inline 上下文
- 部分接受（Ctrl+→ 一词 · Tab 跳下一 suggestion）

## F3 — Spec Artifacts v2

- `hooks.yaml` JSON Schema · 校验 · 设置页 Spec 目录浏览/创建
- Hook 执行日志只读预览

## F4 — AIDE Runtime Engine

- `runtimeOrchestrator` production 双写入队
- `hookRunner`：`queue.before|after` · `apply.after` · `verify.fail`
- `PanelHost` / `ChatPanel` / `AgentApplyModal` 接线 coordinator

## F5 — Activity Line

- `VITE_AIDE_ACTIVITY_LINE` 生产 UI
- 队列 · Agent 写入 · Hook 事件可折叠时间线

## F6 — Verify 闭环

- `acceptanceRunner`：checkbox + ` ```aide-acceptance ` 命令块
- 失败 → `verify.fail` hooks + `runtime-state.json` 持久化

## F7 — 平台 GA

- `v15Features.ts` · `SettingsV15FeaturesCard`
- `V1.5_ENV.md` · `V1.5_GA_EXECUTION.md`
- E2E：`v15-features` · `tab-plus-plus` · `aide-runtime`

## F8 — 评分与收官

- `COMPETITOR_SCORE_V1.5.md`（综合 **~3.50～3.52**）
- `IDE_GAP_CHECKLIST` v1.5 达成列
- `V1.6_KICKOFF.md` · `ROADMAP_V1.6.md` 起草

## 验证

```bash
npm run test:local
npm run test:e2e:local
```

## 文档

- [V1.5_KICKOFF.md](./V1.5_KICKOFF.md)
- [ROADMAP_V1.5.md](./ROADMAP_V1.5.md)
- [ADR_V1.5_PLATFORM_MODELS.md](./ADR_V1.5_PLATFORM_MODELS.md)
- [ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md)

**宣传**：仍关闭（GA 后单独决策）。
