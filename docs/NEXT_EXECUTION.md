# 当前执行清单

> **当前稳定**：**v1.0.8**（质量收口） · **当前开发**：**v1.1.x**（计划系统产品化） · 发版 Runbook：[RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md)

---

## 当前：v1.1.x（计划系统产品化）

### 目标

- **多计划管理**：计划列表支持搜索/排序/状态摘要
- **步骤选择执行**：支持选择任意计划步骤执行，不再局限第一步
- **顺序执行队列**：支持多步骤排队执行，并逐步回填到 plan 文件
- **计划联动 Specs**：计划步骤可映射到 specs tasks，避免重复录入

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

## v1.1.x 迭代点（计划系统产品化）

### v1.1.0（多计划管理）

- 计划目录服务：支持搜索/排序（最近执行、未完成数、标题）
- 管理 UI：展示未完成步骤数与最近执行时间，统一打开/删除反馈

### v1.1.1（步骤选择执行）

- 从 plan 中读取全部未完成步骤，支持选择任意步骤执行
- 支持多步骤顺序执行队列，执行结果逐步回填到 plan

### v1.1.2（计划与 Specs 联动 + 回填统一）

- 计划步骤可映射到最近 Spec 的 `tasks.md`，并做去重
- Plan 回填日志补齐元信息（runId/provider/model/summary），与 Spec 执行日志风格对齐
