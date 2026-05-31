# Release Notes — v1.1.6（Git 可视化）

**日期**：2026-05-29 · **类型**：大更新（轨道 B）

---

## 亮点

- **编辑器内 diff（F1）**：Git 面板「Diff」在 Monaco **DiffEditor** 内打开独立 tab（`git-diff`），主题与主编辑器同步；Agent apply 仍用 modal `DiffViewer`
- **Stage UX（F2）**：Staged / Changes 分组；**暂存差异**（HEAD vs index）；状态栏与命令面板 **Stage all**；协作 Viewer 只读
- **Log drill-down（F3）**：历史 commit 展开 → 变更文件列表 → 单文件 **`@ commit`** diff tab；相对时间显示
- **分支 + 空态（F4）**：新建分支表单与校验；`InlineStatePanel` 空态（未 init / 无改动 / 无提交）；大仓库 status **性能 hint**
- **i18n + 快捷键（F5）**：全部 **`git.*`** ja-JP 覆盖；**Ctrl+Shift+G** 切换 Git 面板；Welcome 补充 Git 快捷键与功能说明

---

## 升级说明

- 从 **1.1.5.x** 升级：终端 / 底栏 / Tasks 行为兼容；Git 仍基于 **isomorphic-git**（WebContainer 工作区）
- Command Palette：**Git 面板**（Ctrl+Shift+G）、**全部暂存**（有未暂存改动时）
- diff tab 与文件 tab 分离（`gitDiffTabs`），关闭 diff 不影响已打开文件
- 协作 Viewer 无法 stage / commit（延续 v1.1.3+ 行为）

---

## 新依赖

无（沿用 `@monaco-editor/react` DiffEditor）

---

## 环境

无新增必填 env。Git 可视化需 WebContainer 运行时就绪；桌面端仍走浏览器内 isomorphic-git。

---

## 限制

- 大文件 diff 未做懒加载截断（→ **1.1.6.x** patch）
- 历史默认 depth **50** 条，无分页（→ 1.1.6.x）
- 无 merge conflict 三向合并、PR UI、submodule / LFS
- 桌面 **原生 git CLI** 替代 isomorphic-git → 长期路线（1.1.6.x+ 探索）

---

## 文档

- [V1.1.6_MASTER_PLAN.md](./V1.1.6_MASTER_PLAN.md)
- [V1.1.6_GA_EXECUTION.md](./V1.1.6_GA_EXECUTION.md)
- [ROADMAP_V1.1.6.x_PATCHES.md](./ROADMAP_V1.1.6.x_PATCHES.md)
- [CHANGELOG.md](../CHANGELOG.md#116--2026-05-29)

---

## 测试

```bash
npm run test:unit          # 471 tests
npm run test:local         # tsc + unit
npm run test:e2e           # UI smoke（可选）
npm run smoke:report       # 生产 health（部署后）
```

---

## 发版

```bash
git tag v1.1.6
npm run deploy             # 或 vercel --prod
```
