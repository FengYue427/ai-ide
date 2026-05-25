# IDE 4a RC — 本地项目 + 工具 Agent（2026-05-25）

> 版本建议：**v1.1.0-rc** · 浏览器版（Chrome / Edge 推荐）

## 亮点

1. **打开本机项目（像 Cursor）**  
   工作区管理 →「打开本机项目」：用 File System Access 读写真实文件夹；保存与 Agent 写入会同步到磁盘。

2. **工具 Agent（多轮读写）**  
   Agent 模式 + DeepSeek 等 OpenAI 兼容 API：自动 `list_files` / `read_file` / `write_file` / `search_repo`；Chat 内显示活动时间线。

3. **安全默认**  
   `write_file` 默认进 **Diff 预览**（设置 → 功能 → Agent 工具循环 → 自动应用写入）。

## 使用步骤

1. 使用 **Chrome 或 Edge**，登录账号（可选，BYOK 亦可）。
2. **工作区管理** → 打开本机项目 → 选择仓库目录。
3. AI 助手 → 开启 **Agent** → 确认显示「工具 Agent（多轮读写）」。
4. 描述任务，例如：「读取 `src/App.tsx`，把标题改成 Hello AI IDE 并写回」。
5. 在 **预览变更** 中确认后应用。

## 限制（见 [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md)）

- Safari / Firefox 无法写本地盘（可继续用 IndexedDB 工作区）。
- 本地目录约 **500** 个文本文件上限。
- `run_command` 仅在 WebContainer 终端内执行，非本机 shell。

## 反馈

RC 期间欢迎反馈：工具循环失败、写盘不同步、配额与订阅问题。
