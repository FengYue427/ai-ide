# 浏览器版 AI IDE 能力边界

> 对标桌面 IDE（Cursor / VS Code）时，以下限制来自 **浏览器 + WebContainer** 运行时，而非产品疏漏。

## 运行环境

| 能力 | 状态 | 说明 |
|------|------|------|
| Node / npm 脚本 | ✅ | 通过 WebContainer 在浏览器内运行；首次加载需等待环境就绪 |
| 原生系统调用 | ❌ | 无法直接执行本机已安装的 `node` / `python` |
| 调试器（断点） | ❌ | 无 DAP/调试适配器；可用 `console.log` + 终端输出 |
| 大仓库 | 🔶 | 工作区默认上限约 **100 文件 / 10MB**；**打开本地文件夹**可导入最多 **500** 个文本文件（Chrome/Edge FS Access） |
| **本地项目文件夹** | ✅ IDE-4a | 「工作区管理 → 打开本机项目」：读写真实磁盘；需 Chromium 系（Chrome/Edge）；最多约 500 个文本文件 |

## Git

| 能力 | 状态 | 说明 |
|------|------|------|
| 状态 / diff / 提交 | ✅ | 基于 isomorphic-git + 虚拟 FS |
| 远程 push（GitHub） | 🔶 | 需 token；受浏览器与代理限制 |
| 与系统 Git 混用 | ❌ | 仓库存在于 WebContainer 内存 FS，非本机 `.git` |

## AI

| 能力 | 状态 | 说明 |
|------|------|------|
| BYOK 聊天 / Agent | ✅ | 用户自带 API Key |
| 语义检索 | 🔶 | 可选 embedding（OpenAI 兼容 `/embeddings`） |
| MCP 工具 | 🔶 | 经 `/api/mcp/proxy`；生产环境 localhost 需显式放行 |
| **内置 Agent 工具** | ✅ IDE-4a | `list_files` / `read_file` / `write_file` / `search_repo` / `run_command`；多轮 `agentRunner`（DeepSeek 等 OpenAI 兼容 API）；设置 → 功能 → Agent 工具循环 |
| 后台长任务 Agent | ❌ | 需服务端任务队列（未纳入 RC） |

## 推荐工作流

1. 小中型前端/Node 项目：导入工作区 → `npm install` → `npm run dev`（命令面板）
2. 需要本机调试：导出 ZIP 或在桌面打开同仓库
3. 生产部署：见 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
