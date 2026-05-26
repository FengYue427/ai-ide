# IDE-4b — 桌面版（Electron）

> **战略**：[PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md) §阶段 1

---

## 进度

| ID | 任务 | 状态 |
|----|------|:----:|
| 4b-1 | Electron 壳 + preload | ✅ |
| 4b-2 | 本机终端 `run_command` | ✅ |
| 4b-3 | fs 扫描 2000 文件 / 索引 800 | ✅ |
| 4b-4 | Windows 便携版 + 菜单 Ctrl+O | ✅ |
| 4b-5 | 自动更新 | ⬜ |

---

## 三种运行模式

| 模式 | 命令 | 加载内容 |
|------|------|----------|
| **开发** | `npm run electron:dev` | `http://127.0.0.1:3000` + 本地 API 代理 |
| **打包（推荐）** | `npm run electron:pack` | **线上** https://ai-ide-flame.vercel.app + preload 本机能力 |
| **离线包** | `npm run build:electron` + `AI_IDE_DESKTOP_OFFLINE=1` | 本地 `dist/`（登录需跨域，仅高级用途） |

打包版默认 **remote shell**：与浏览器版同一站点，**登录/支付宝/订阅** 与线上一致；preload 注入 `window.aiIdeDesktop` 提供大文件夹与真终端。

**注意**：remote shell 需线上已部署含 IDE-4b 前端（`localProjectService` 桌面分支）。发版后执行一次 `git push` + Vercel 部署。

---

## 开发

```powershell
cd c:\Users\18663\IDE\ai-ide
npm install

# 完整 API
npm run dev:stack
# 另开终端
npm run electron:start

# 或一键（仅 Vite，无本地 API）
npm run electron:dev
```

### 打包 Windows 便携版（exe）

```powershell
npm run electron:pack
```

产物：`release/AI-IDE-1.0.0-win-portable.exe`（约 150MB+，含 Chromium）。

安装版：

```powershell
npm run electron:pack:installer
```

---

## 桌面功能

- **File → Open Project Folder**（Ctrl+O）：系统对话框，最多 **2000** 文件导入工作区  
- **本机终端**：Agent `run_command` 在项目根执行 shell  
- **写盘**：`write_file` 直接落盘  
- **File → Open in Browser**：系统浏览器打开线上站  

---

## 验收

- [ ] `electron:pack` 成功生成 exe  
- [ ] 便携版启动后可见线上 IDE（需能访问 vercel.app）  
- [ ] Ctrl+O 打开 >500 文件仓库  
- [ ] Agent `run_command` → `node -v` 有输出  
- [ ] 登录 + 订阅与浏览器一致  

---

## 架构

```
electron/main.mjs      — 窗口、菜单、IPC、spawn
electron/preload.mjs — aiIdeDesktop（含 onProjectOpened）
electron/fsProject.mjs
src/services/desktopBridge.ts
src/services/localProjectService.ts
```
