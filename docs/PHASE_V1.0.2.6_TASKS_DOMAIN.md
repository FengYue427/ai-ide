# v1.0.2.6 — 任务清单 + 域名 + 配额 Toast

## 交付

| ID | 内容 |
|----|------|
| 2.6-1 | **`.aide/tasks.md`** + 设置 → 功能 **任务清单** 预览；未完成项注入 Agent |
| 2.6-2 | **[CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md)** + `BROWSER_LIMITATIONS` / 设置网络说明 |
| 2.6-3 | 欢迎页页脚 **`welcome.appUrl`**（当前 `APP_URL` / origin） |
| 2.6-4 | Chat **配额用尽 / 请求失败** → `notify` toast（L16 关键路径） |

## 关键文件

- `src/services/projectTasksService.ts`
- `src/components/ProjectTasksSection.tsx`
- `src/lib/appOrigin.ts`
- `src/components/ChatPanel.tsx`（`notify` prop）
- `docs/CUSTOM_DOMAIN.md`

## 手动验证

1. 设置 → 功能 → **创建 .aide/tasks.md** → 勾选预览与进度。
2. Agent 对话 → system 含「待办任务」小节（仅未完成项）。
3. 用尽配额发消息 → 聊天内错误 + 右上角 error toast。
4. 自定义域部署后欢迎页显示当前 URL。
