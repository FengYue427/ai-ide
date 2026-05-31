# PTY Spike — v1.1.5.5（Electron 桌面）

> **状态**：Spike 已落地 · **默认回退** line REPL

---

## 目标

验证在 Electron 桌面端用 **node-pty** 提供真实伪终端，替代一次性 `spawn` + 行式 REPL。

---

## 实现摘要

| 组件 | 说明 |
|------|------|
| `electron/ptyBridge.mjs` | 动态 `import('node-pty')`，失败则 `available: false` |
| IPC | `desktop:pty-capabilities` · `pty-spawn` · `pty-write` · `pty-resize` · `pty-kill` |
| 事件 | `desktop:pty-data` · `desktop:pty-exit` |
| 渲染层 | `useDesktopPtyShell` · `IntegratedTerminal` 显示 PTY 徽章 |
| 回退 | 无 node-pty 时沿用 **line REPL**（`desktop:run-command`） |

---

## 本地启用 PTY

```powershell
cd c:\Users\18663\IDE\ai-ide
npm install node-pty --save-optional
$env:AI_IDE_PTY = "1"
npm run electron:dev
```

Windows 需 **Visual Studio Build Tools**（原生模块编译）。安装失败时 IDE 自动回退，不影响发版。

禁用探测：`AI_IDE_PTY=0`

---

## 结论（Spike）

| 项 | 结果 |
|----|------|
| **可行性** | ✅ 架构可行；依赖可选安装 |
| **默认 GA** | ❌ 不捆绑 node-pty（避免 CI/用户机编译失败） |
| **下一步** | v1.1.6+ 可选「桌面完整终端」特性开关 + 预编译 binary |

---

## 与 1.1.5.4 关系

- 浏览器：**多 session** 各绑定独立 jsh（切换时重建 shell，保留 scrollback）
- 桌面：多 session 元数据 + PTY 按 `activeSessionId` 绑定
