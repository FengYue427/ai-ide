# v1.1.5.x 补丁（终端 + 底栏抛光）

> **前置**：tag **`v1.1.5`**（B 轨 GA）  
> **长期上下文**：[ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) · **B 轨**：[V1.1.5_MASTER_PLAN.md](./V1.1.5_MASTER_PLAN.md)

---

## 定位

v1.1.5.x 是 **轨道 A** 小 patch，在 v1.1.5 整包 GA 后持续抛光终端 / 底栏 / 任务工作流，**不阻断** v1.1.6（Git 可视化）规划。

---

## 已完成

| 版本 | 主题 | 状态 |
|------|------|:----:|
| **1.1.5.1** | 终端 **resize 同步** + 底栏 tab 快捷键 + terminal **ja** + 移除废弃 `Terminal.tsx` | ✅ |
| **1.1.5.3** | **Tasks 面板** 分组折叠 · 大清单 preview · 全完成空态 | ✅ |
| **1.1.5.4** | 终端 **多 session**（≤4 · 切换保留 scrollback） | ✅ |
| **1.1.5.5** | **Electron PTY spike**（node-pty 可选 · IPC 流式） | ✅ |

---

## 建议 backlog

| 版本 | 主题 | 说明 | 优先级 |
|------|------|------|:------:|
| **1.1.5.3** | **Tasks 面板** 空态 / 大清单性能 | 虚拟列表或分组折叠 | ✅ |
| **1.1.5.4** | 终端 **多 session** 探索（单 tab 内） | 非 PTY，仅 jsh 会话切换 | ✅ |
| **1.1.5.5** | **Electron PTY** spike | node-pty 可行性验证 | ✅ |
| **1.1.5.6+** | 底栏 / 终端 **i18n 漏翻** | GA 后用户反馈驱动 | P1 |

---

## 发版

与 1.1.4.x 相同：`test:local` → bump `package.json` 第四段 → `CHANGELOG` → deploy（可选 tag `v1.1.5.N` 仅重大 patch）。

---

## 与 v1.1.6 边界

| 放 1.1.5.x | 放 v1.1.6（B 轨） |
|------------|-------------------|
| 终端 resize、快捷键、i18n 漏翻 | **Git diff / stage / log** 新子系统 |
| Scripts / Tasks 面板 UX 微调 | 多根工作区 |
| 移除废弃组件、小 bug | 插件 SDK 扩展面 |

**节奏**：1.1.5.x 活跃至 v1.1.6 Kickoff；P0 热修可随时插入。
