# Intent OS — 5 分钟上手

AI IDE 的差异化不是「黑盒 Agent」，而是 **Spec → 队列 → 验收 → 证明包** 的可追溯闭环。

## 1. 从欢迎页开始（推荐）

1. 打开欢迎页，点击 **「60 秒 Intent 演示」**（或 Intent 卡片）。
2. 系统自动加载 Demo Pack，并打开 **Intent Shell**（左 Graph · 中 Editor · 右 Queue）。
3. 跟随 `tasks.md` 完成第一项任务，观察队列从 idle → running → verify。

## 2. Intent Shell 三栏

| 区域 | 作用 |
|------|------|
| **左 · 意图图谱** | Plan / Spec 任务 / acceptance 分组展示；高亮「下一关」任务 |
| **中 · 编辑器** | 编辑 Spec 产物与源码 |
| **右 · 验收队列** | pending / running / 失败 / Grounding 拦截 |

顶栏快捷操作：**保存证明包**、**Autopilot · 下一关**（显示剩余 open 任务数）、Drift 修复入口。

窄屏（≤1100px）时 Graph / Queue 通过顶栏 Tab 切换，不再隐藏。

## 3. 典型闭环

1. **写 Spec**：`.aide/specs/<slug>/tasks.md` + `acceptance.md`
2. **入队执行**：Plan 映射或 Chat 内 Spec 队列
3. **验收**：acceptance 检查通过 → 写入 `.aide/reports/proof-*.md` / `*.html`
4. **分享 / 恢复**：证明包或 `.aide/meta/intent-share.json` 可恢复 Graph 与队列上下文

## 4. 与 Plan 系统的关系

- Plan 总览与 Spec Studio 见 [PLAN_SYSTEM_QUICKSTART.md](./PLAN_SYSTEM_QUICKSTART.md)
- Intent OS 是 **执行与验收层**；Plan 是 **规划与映射层**

## 5. 生产环境开关

构建时默认开启（见 `.env.production.example`）：

| 变量 | 作用 |
|------|------|
| `VITE_AIDE_RUNTIME` | 队列 hooks、runtime-state.json |
| `VITE_AIDE_RUNTIME_UI` | Activity Line 与编排 UI |
| Tier C flags | `groundingGateV2`、`intentGraphV2` 等（见 `src/lib/intentOsTierC.ts`） |

## 6. 常用入口

- **设置 → 功能**：开关 Intent Shell、意图图谱
- **StatusBar**：Shell 未开启时显示 Graph / Autopilot 快捷入口；Shell 开启后去重
- **E2E 回归**：`e2e/intent-os-b1.spec.ts`

更多路线图见 [INTENT_OS_ROADMAP.md](./INTENT_OS_ROADMAP.md)。
