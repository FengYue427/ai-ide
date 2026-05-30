# Release Notes — v1.1.5（集成终端 + 底栏工作流）

**日期**：2026-05-29 · **类型**：大更新（轨道 B）

---

## 亮点

- **交互式终端（F1）**：xterm.js 集成终端；WebContainer **jsh** 交互 shell；桌面端 line-based REPL；输出缓冲注入 Agent 上下文
- **NPM Scripts 面板（F2）**：底栏 **Scripts** 标签，解析工作区 `package.json` scripts，一键 `npm run …` 并自动切回终端
- **Tasks 面板（F3）**：底栏 **Tasks** 标签，聚合 `.aide/tasks.md` 与 `.aide/specs/*/tasks.md`；搜索、跳转行、创建模板、**Send to Agent**
- **底栏 UX（F4）**：Terminal / Scripts / Tasks 三 tab；顶边拖拽调整高度；tab 与高度 **localStorage** 持久化；窗口 resize 自动钳制
- **i18n + 快捷键（F5）**：底栏 / Scripts / Tasks 相关 **ja-JP** 覆盖；`Ctrl+`` 切换终端；Welcome 页补充终端快捷键

---

## 升级说明

- 从 **1.1.4** 升级：设置与 autosave 行为兼容；底栏默认高度 **260px**，可在浏览器本地存储中保留偏好
- 原 Settings 内 **任务清单** 预览保留，并增加「打开任务面板」入口
- Command Palette 新增：**打开 NPM Scripts 面板**、**打开任务面板**
- 协作 / 编辑器 / ja Phase 2 行为同 v1.1.4，无 breaking change

---

## 新依赖

- `@xterm/xterm` · `@xterm/addon-fit`（终端渲染）

---

## 环境

无新增必填 env。WebContainer 终端需现代 Chromium 浏览器；Electron 桌面使用内置 REPL 桥。

---

## 限制

- 桌面端终端为 **非 PTY** 行式 REPL，与完整 shell 体验仍有差距（PTY → v1.1.6+）
- WebContainer 交互 shell 受浏览器沙箱与网络策略约束
- `smoke:report` 需在可访问 Vercel 生产的网络环境补跑

---

## 文档

- [V1.1.5_MASTER_PLAN.md](./V1.1.5_MASTER_PLAN.md)
- [V1.1.5_GA_EXECUTION.md](./V1.1.5_GA_EXECUTION.md)
- [CHANGELOG.md](../CHANGELOG.md#115--2026-05-29)

---

## 测试

```bash
npm run test:unit          # 450 tests
npm run test:local         # tsc + unit
npm run test:e2e           # UI smoke（可选）
npm run smoke:report       # 生产 health（部署后）
```

---

## 发版

```bash
git tag v1.1.5
npm run deploy             # 或 vercel --prod
```
