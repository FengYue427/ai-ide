# Release Notes — v1.1.7（调试器 MVP）

**日期**：2026-05-29 · **类型**：大更新（轨道 B）

---

## 亮点

- **Debug 底栏（F1）**：WebContainer 内 `node --inspect-brk` · Inspect URL 探测 · Debug 面板
- **断点 gutter（F2）**：Monaco 行号左侧断点 · 启用/禁用（Alt+点击）· CDP `setBreakpointByUrl` 同步 · `debugger;` 注入回退
- **调用栈 + 变量（F3）**：CDP `Debugger.paused` 解析栈帧 · `Runtime.getProperties` 只读 locals · 对象一层预览
- **执行控制（F4）**：Continue（F5）· Step Over/Into/Out（F10/F11/Shift+F11）· 与 Run/npm 互斥
- **i18n + 命令面板（F5）**：`debug.*` / `command.debug.*` ja 全量 · **开始调试** · `Ctrl+Alt+4` 打开 Debug tab
- **协作（F6）**：Viewer 无法设断点 / 启动调试 / 单步（Host/Editor 可用）

---

## 升级说明

- 从 **1.1.6.x** 升级：Git / 终端 / Tasks 行为兼容；调试挂接同一 WebContainer 执行面
- Command Palette：输入「调试」→ **开始调试**、打开面板、继续/单步/停止
- 调试会话进行中：工具栏 Run、终端 Run、npm 脚本均禁用，需先 **停止调试**（Shift+F5）
- CDP WebSocket 不可用时自动回退 `debugger;` 注入（无调用栈/单步，仅暂停）

---

## 新依赖

无（浏览器原生 WebSocket + CDP 子集）

---

## 环境

无新增必填 env。调试需 WebContainer 就绪；Inspect 端口默认 **9229**。

---

## 限制

- 无 DAP 适配层 · 无条件断点 · 修改变量 · Watch 表达式
- 大对象变量树截断（一层预览，最多约 12 键）
- Electron 桌面 `--inspect-brk` attach → **1.1.7.x** patch
- 预览 iframe / 前端 CDP → 长期路线

---

## 文档

- [V1.1.7_MASTER_PLAN.md](./V1.1.7_MASTER_PLAN.md)
- [V1.1.7_GA_EXECUTION.md](./V1.1.7_GA_EXECUTION.md)
- [V1.1.7_KICKOFF.md](./V1.1.7_KICKOFF.md)
- [CHANGELOG.md](../CHANGELOG.md#117--2026-05-29)

---

## 手测清单（WebContainer）

1. 打开 `index.js`，行号左侧设断点  
2. Debug 面板 → **调试 index.js**  
3. 命中断点 → 查看调用栈与 locals  
4. **继续**（F5）或 **单步跳过**（F10）  
5. **停止调试**（Shift+F5）  
6. 协作房间以 **Viewer** 加入 → 确认无法设断点 / 开始调试  

---

## 测试

```bash
npm run test:local         # tsc + unit（524+ tests）
npm run smoke:report       # 生产 health（部署后）
```

---

## 发版

```bash
git tag v1.1.7
npm run deploy             # 或 vercel --prod
```
