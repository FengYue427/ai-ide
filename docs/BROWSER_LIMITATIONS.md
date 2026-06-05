# 浏览器版 AI IDE 能力边界

> 对标桌面 IDE（Cursor / VS Code）时，以下限制来自 **浏览器 + WebContainer** 运行时，而非产品疏漏。  
> **桌面版（Electron）** 另见下表「桌面」列。实现常量：`src/services/indexLimits.ts`、`localProjectService.ts`、`electron/fsProject.mjs`。

## 容量上限（v1.0.2.1 与代码一致） {#capacity-limits}

| 场景 | 浏览器（Web） | 桌面（Electron） |
|------|:-------------:|:----------------:|
| 打开本机文件夹导入 | **500** 个文本文件 | **2000** 个文本文件 |
| 项目索引 / @ 检索 | **500** 个文件 | **2000** 个文件 |
| 单文件索引大小 | 120 KB | 120 KB |
| 索引总字节上限 | 约 4 MB | 约 4 MB |
| 大仓索引 | 后台 Worker 分批构建 | 同左 |
| 云工作区虚拟 FS | 约 **100** 文件 / 10 MB | 同左（走 Web 逻辑） |

## 运行环境

| 能力 | 浏览器 | 桌面 | 说明 |
|------|:------:|:----:|------|
| Node / npm 脚本 | ✅ | ✅ | 浏览器经 WebContainer；桌面为本机 shell |
| 原生系统调用 | ❌ | ✅ | 桌面 `run_command` 使用本机环境 |
| 调试器（断点） | 🔶 | 🔶 | 无完整 DAP；**条件断点**在 CDP 同步模式下可用（`x > 1`）；inject 模式见下节 |
| **本地项目文件夹** | ✅ | ✅ | 「打开本机项目」；浏览器需 Chromium FS Access |

## 条件断点（v1.3.2）

| 模式 | 条件表达式 | 命中次数 |
|------|:----------:|:--------:|
| **CDP 同步**（`syncMode: cdp`） | ✅ 由调试器求值 | ✅ 侧栏编辑，未达 N 次前自动 continue |
| **inject**（`debugger;` 注入） | ❌ | ❌ 请改用 CDP 断点；设置页调试卡有提示 |

侧栏 **断点** 列表可编辑 condition / hitCount；编辑器行号左侧带条件角标。

## Git

| 能力 | 状态 | 说明 |
|------|------|------|
| 状态 / diff / 提交 | ✅ | 基于 isomorphic-git + 虚拟 FS |
| 远程 push（GitHub） | 🔶 | 需 token；受浏览器与代理限制 |
| 与系统 Git 混用 | ❌ | 云工作区在 WebContainer 内存 FS，非本机 `.git` |

## AI

| 能力 | 状态 | 说明 |
|------|------|------|
| BYOK 聊天 / Agent | ✅ | 用户自带 API Key |
| 语义检索 | 🔶 | 可选 embedding（OpenAI 兼容 `/embeddings`） |
| MCP 工具 | 🔶 | 经 `/api/mcp/proxy`；生产 localhost 需显式放行 |
| **内置 Agent 工具** | ✅ | `list/read/write/search_repo/grep_repo/run_command` |
| 后台长任务 Agent | ❌ | 规划 1.0.2.6+ / 主版本 1.0.3 |

## 网络与访问（国内）

| 现象 | 建议 |
|------|------|
| `*.vercel.app` 加载慢或超时 | 换网络/时段重试；安装 **Windows 桌面版**（壳内仍加载线上 UI，但本机盘与终端不依赖浏览器 FS） |
| 仅 BYOK 本地编辑 | 云端不可用时仍可用；见欢迎页网络提示 |
| 自定义域名 | 见 [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) |

## 推荐工作流

1. 小中型前端/Node 项目：导入工作区 → `npm install` → `npm run dev`（命令面板）
2. 需要本机调试或大仓：使用 **桌面版** 或导出 ZIP 在本地 IDE 打开
3. 生产部署：见 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
