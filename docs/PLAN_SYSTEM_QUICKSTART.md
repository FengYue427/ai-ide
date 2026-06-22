# Plan / Spec 系统 — 快速上手

AI IDE 的核心差异化：**写计划 → 映射 Spec → 队列执行 → 报告留档 → 可恢复**。

## 1. 创建计划

1. 打开 **设置中心 → 计划总览**，或侧栏 **Plan** 区域。
2. 点击 **新建计划**，选择模板（如「功能迭代」「Bug 修复」）。
3. 计划文件保存在工作区 `.aide/plans/`。

## 2. 映射并执行 Spec

1. 在 Plan 步骤中点击 **映射 Spec** 或 **执行队列**。
2. Spec 目录位于 `.aide/specs/`；可用 **Spec Studio**（欢迎页快捷入口）按技术栈模板创建。
3. 队列面板显示 pending / running / 成功 / 失败；失败可重试或跳过。

## 3. 报告与恢复

1. 执行完成后，报告写入 `.aide/reports/`。
2. 在 **报告目录** 中预览，可 **恢复队列** 继续未完成步骤。
3. Plan ↔ Spec 溯源见 `.aide/meta/plan-spec-links.json`。

## 4. 生产环境开关

以下变量在 `.env.production.example` 中默认开启（构建时注入）：

| 变量 | 作用 |
|------|------|
| `VITE_AIDE_SPEC_ARTIFACTS_V2` | Spec hooks.yaml 目录与 Spec Studio |
| `VITE_AIDE_RUNTIME` | hooks 编排、队列 before/after |
| `VITE_AIDE_ACTIVITY_LINE` | Chat 顶部 Activity Line |

协作（`VITE_COLLAB_M1_SIGNAL`）与后台 Agent UI（`VITE_BACKGROUND_AGENT`）生产默认关闭。

## 5. 相关命令

```bash
npm run dev:stack          # 本地 API + 前端
npm run test:e2e           # 含 spec-catalog-ui 等回归
```

更多环境变量见 [ENV_PRODUCTION.md](./ENV_PRODUCTION.md)。
