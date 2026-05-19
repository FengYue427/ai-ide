# Electron 桌面壳评估（IDE-3 待定）

> 目标：在保留现有 Web IDE 能力的前提下，提供可选原生安装包，缩小与 Cursor 在「桌面集成」上的差距。

## 建议方案

| 方案 | 优点 | 缺点 | 建议 |
|------|------|------|------|
| **Electron + 加载现有 Vite 构建** | 复用 100% 前端；可访问本地 FS | 包体大；需维护 auto-update | **首选试点** |
| Tauri | 包体小 | Rust 桥接成本高；WebContainer 兼容性待验证 | 长期备选 |
| PWA 安装 | 零额外壳 | 仍受浏览器沙箱限制 | 已可作为补充 |

## 试点范围（MVP）

1. `electron/main.ts`：单窗口加载 `file://` 或 `http://localhost:3000`（dev）
2. **本地文件夹打开**：`dialog.showOpenDialog` → 读入文件树 → 写入 `workspaceContextService`（绕过 10MB/100 文件浏览器限制可配置更高）
3. **菜单**：打开文件夹、保存、退出；快捷键与 Web 版一致
4. **不纳入 MVP**：系统级 Git、LSP 子进程、调试器

## 与现架构关系

```
┌─────────────────────────────────────┐
│  Electron main (Node)                │
│  - 本地 FS read/write               │
│  - 可选：spawn 本机 node/npm        │
└──────────────┬──────────────────────┘
               │ preload IPC
┌──────────────▼──────────────────────┐
│  现有 React + Monaco + ideStore     │
│  WebContainer 可选（与 Web 版相同）  │
└─────────────────────────────────────┘
```

## 决策门槛（何时立项）

- [ ] P0 生产部署稳定（health、注册、工作区云存）
- [ ] 浏览器版 MAU/反馈明确需要「打开本地文件夹」
- [ ] 有 1～2 周专门人力（不与 P1 支付并行抢资源）

## 参考命令（未来）

```bash
# 占位 — 尚未在 package.json 中实现
npm run electron:dev
npm run electron:build
```

当前阶段：**不阻塞 RC**；以 `docs/BROWSER_LIMITATIONS.md` 说明浏览器能力边界即可。
