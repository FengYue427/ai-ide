# 当前执行清单

> **当前稳定**：**v1.0.8**（质量收口） · **当前开发**：**v1.0.9**（Plan 模式） · 发版 Runbook：[RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md)

---

## 当前：v1.0.9（Plan 模式 · 首个可执行闭环）

### 目标

- **Plan 模式入口**：在 Chat 内提供 Plan 模式切换（先计划后执行）
- **计划落盘**：计划输出自动保存到 `.aide/plans/*.md`
- **任务提取**：从计划的 checklist 自动提取并追加到 `.aide/tasks.md`
- **计划可执行化（v1.0.9.x）**：从计划中一键执行第一步，自动切换到 Agent 执行

---

## 发版步骤（PowerShell）

```powershell
cd C:\Users\18663\IDE\ai-ide

# 1) 本地门禁（最小）
npm run test:local

# 2) 生产环境变量检查（可选：本机未配 DATABASE_URL 时会失败）
npm run check:release

# 3) 推送（若尚未 push）
git push origin main
```

## GitHub Release（手工网页）

由于部分环境未安装 `gh`，Release 页面建议走 GitHub 网页：

- 选择 tag：`v<version>`（例如 `v1.0.8`）
- 标题：同 tag
- 正文：复制 `CHANGELOG.md` 中对应版本段落（例如 `[1.0.8]`）

---

## 门禁

```powershell
npm run test:local
npm run mcp:smoke
npm run go-live:preflight
```

---

## v1.0.9.x 迭代点（Plan 模式增强）

- 计划步骤执行：支持选择步骤（不仅第一步），并把执行结果回填到 plan 文件
- 计划与 specs 联动：把计划步骤映射到 specs tasks，并支持“执行任务”
- UI：Plan 结果的结构化展示（目标/影响文件/步骤/风险/验证）与折叠
