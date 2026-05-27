# v1.0.3 RC live spotcheck

- **URL**: https://ai-ide-flame.vercel.app
- **Time**: 2026-05-27T03:05:04.528Z
- **Expect version**: 1.0.3.4

## Automated

- [x] **health** — ok db=connected version=1.0.3.4
- [x] **deploy version** — 1.0.3.4
- [x] **Chat (API)** — session endpoint OK
- [x] **Chat (quota)** — anonymous free plan
- [x] **支付宝 (API)** — billing.alipay=true, wechat=false (1.0.3 决策)
- [x] **frontend bundle** — 752 KB main chunk
- [x] **Agent + hunk (bundle)** — 块级 Diff 预览
- [x] **Tab FIM (bundle)** — 设置 → 编辑器 Tab 补全
- [x] **@ 索引 (bundle)** — @ 提及与索引上限

## 竞品 live 抽测 — 人工（5 项）

- [ ] **1. Chat** _(manual)_ — BYOK 或 Ollama → 发送「解释当前文件」；确认流式回复与配额计数
- [ ] **2. Agent + hunk** _(manual)_ — Agent 开 → write_file（自动应用关）→ 块级 Diff 接受/拒绝 → 应用已选块
- [ ] **3. Tab** _(manual)_ — 设置 → 编辑器 → Tab 补全开 → 编辑器内停顿触发幽灵补全
- [ ] **4. @ 索引** _(manual)_ — 导入 ≥10 文件 → Chat 输入 `@` 选文件 → 确认上下文注入与索引进度
- [ ] **5. 支付宝** _(manual)_ — 设置 → 查看套餐 → 专业版下单（沙箱或生产 Path B）→ 回调后 plan=pro

**Automated**: pass

---

## 附录 — 部署收口（2026-05-27）

- Vercel 构建修复（`vite worker.format: es`）+ `/api/health` 版本对齐后，生产 **`health.version=1.0.3.4`**。
- **阶段 A** 自动验收完成；**阶段 B** 启动 → [V1.0.4_KICKOFF.md](./V1.0.4_KICKOFF.md)。
