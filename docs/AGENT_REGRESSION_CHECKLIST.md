# Agent 工具循环 — 手动回归清单（4a-RC）

> 环境：`npm run dev:stack` · Chrome/Edge · 已配置 DeepSeek API Key

| # | 步骤 | 预期 |
|---|------|------|
| 1 | 工作区管理 → 打开本机项目（含 `index.html` + `index.js`） | 文件树出现；状态无报错 |
| 2 | Agent 开 + 显示「工具 Agent（多轮读写）」 | 工具路径生效 |
| 3 | 发送：「列出项目文件」 | Chat 出现 Agent 活动（list_files）；有路径列表 |
| 4 | 发送：「读取 index.js 全文」 | 活动 read_file；回复含文件内容 |
| 5 | 发送：「把 index.html 的 h1 改成 Hello AI IDE，写回」 | write_file；**未**开自动应用时出现「预览变更」 |
| 6 | 预览变更 → 应用全部 | 编辑器与磁盘 `index.html` 已更新 |
| 7 | 设置 → 功能 → 开启「自动应用写入」后重复写文件 | 无预览条，编辑器直接更新 |
| 8 | `search_repo`：「搜索 index」 | 活动 search_repo；返回路径或符号 |

记录：日期 / 模型 / 通过项 / 失败截图与错误文案。
