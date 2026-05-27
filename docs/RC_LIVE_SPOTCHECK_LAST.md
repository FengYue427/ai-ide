# v1.0.3 RC live spotcheck

- **URL**: https://ai-ide-flame.vercel.app
- **Time**: 2026-05-27T09:25:40.899Z
- **Expect version**: 1.0.6.2

## Automated

- [ ] **health** — fetch failed
- [ ] **Chat (API)** — fetch failed
- [ ] **Chat (quota)** — fetch failed
- [ ] **支付宝 (API)** — fetch failed
- [ ] **frontend bundle** — fetch failed

## 竞品 live 抽测 — 人工（5 项）

- [ ] **1. Chat** _(manual)_ — BYOK 或 Ollama → 发送「解释当前文件」；确认流式回复与配额计数
- [ ] **2. Agent + hunk** _(manual)_ — Agent 开 → write_file（自动应用关）→ 块级 Diff 接受/拒绝 → 应用已选块
- [ ] **3. Tab** _(manual)_ — 设置 → 编辑器 → Tab 补全开 → 编辑器内停顿触发幽灵补全
- [ ] **4. @ 索引** _(manual)_ — 导入 ≥10 文件 → Chat 输入 `@` 选文件 → 确认上下文注入与索引进度
- [ ] **5. 支付宝** _(manual)_ — 设置 → 查看套餐 → 专业版下单（沙箱或生产 Path B）→ 回调后 plan=pro

**Automated**: 5 failed

## Next steps

1. `npm run go-live:preflight`
2. Vercel redeploy → re-run `npm run rc:live-spotcheck`
3. 完成上方 5 项人工 checklist → [V1.0.3_RC.md](../docs/V1.0.3_RC.md)
