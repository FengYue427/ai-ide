# v1.1.7.x 补丁（调试器抛光）

> **更新**：2026-05-31 — **开波** · 前置 tag **`v1.1.7`**（B 轨 GA）  
> **并行 B 轨**：[ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) · **v1.1.8** 插件 SDK

---

## 定位

v1.1.7.x 是 **轨道 A** 小 patch：在 v1.1.7 GA 后抛光 **调试 UX / 稳定性 / 桌面 attach**，**不扩展**为完整 DAP/VS Code 调试器（条件断点高级 UI、Watch、修改变量仍属非目标或 P2）。

**节奏**：`test:local` → bump 第四段 → deploy；**不打** 新 B 轨 tag（对外仍 **v1.1.7**）。

---

## GA 已交付（F1～F6 · 合入 `v1.1.7`）

| 能力 | 摘要 |
|------|------|
| F1 Attach | WebContainer `node --inspect-brk` · Debug 底栏 |
| F2 断点 | Gutter · CDP `setBreakpointByUrl` · `debugger;` 回退 |
| F3 栈/变量 | Call stack · locals 只读 · 对象一层预览 |
| F4 执行 | Continue / Step · F5/F10/F11 · Run 互斥 |
| F5 i18n | `command.debug.*` · ja 全覆盖 · `Ctrl+Alt+4` |
| F6 GA | Viewer 不可调试 · RELEASE_NOTES |

---

## 建议 patch 顺序（P0 → P2）

| 版本 | 主题 | 说明 | 优先级 | 估时 |
|------|------|------|:------:|------|
| **1.1.7.1** | **条件断点 MVP** | 简单表达式 / `hitCount` 存 localStorage；CDP 或注入 | P1 | 3～4d |
| **1.1.7.2** | **Electron inspect attach** | 桌面 bound 文件夹 `node --inspect-brk`；复用 CDP 客户端 | P0 | 4～5d |
| **1.1.7.3** | **调试稳定性** | 断点重连 · 会话结束清理 · 大文件断点 URL 匹配 | P0 | 2～3d |
| **1.1.7.4** | **Watch 表达式（只读）** | 1～3 个固定表达式 · `Runtime.evaluate` | P2 | 3～4d |
| **1.1.7.5** | **预览 iframe CDP** | 前端 `debugger` 与 Vite 预览同屏（探索） | P2 | 5d+ |

### 明确不做（v1.1.8+ 或非调试线）

| 项 | 归属 |
|----|------|
| 完整 DAP 适配层 | v1.1.8 插件/SDK 稳定后再评估 |
| 修改变量 / 热重载调试 | 长期 |
| PR 级远程调试 | 非目标 |

---

## 1.1.7.2 细化（桌面 attach · 建议下一 patch）

**问题**：WebContainer 调试已可用，但 **Electron 打开本地文件夹** 时用户仍期望与 VS Code 一致的 inspect。

**方向**：

1. `electron/main.mjs` spawn 本地 `node --inspect-brk`（已有 git CLI spike 模式可复用）  
2. 将 ws URL 交给现有 `DebugCdpClient`  
3. Debug 面板标注 **Desktop attach** vs **WebContainer**

**DoD**：桌面打开含 `index.js` 的文件夹 → 设断点 → 暂停 → 栈/变量/单步；`test:local` 全绿。

---

## 冻结策略

- **P0 热修**（崩溃、断点完全不命中）可插队，仍走 1.1.7.x 第四段  
- **新 B 轨能力**（插件 SDK 2.0）→ **v1.1.8**，不与 patch 抢人力

---

## 文档

- [RELEASE_NOTES_v1.1.7.md](./RELEASE_NOTES_v1.1.7.md)
- [V1.1.7_GA_EXECUTION.md](./V1.1.7_GA_EXECUTION.md)
- [GIT_DESKTOP_CLI_SPIKE.md](./GIT_DESKTOP_CLI_SPIKE.md)（桌面 CLI 先例）
