# v1.0.2.5 — Agent 工具链

## 交付

| ID | 内容 |
|----|------|
| 2.5-1 | **`grep_repo`**：工作区内容搜索（文本/regex），输出 `path:line: snippet` |
| 2.5-2 | **`run_command`**：桌面/Web 双环境说明；破坏性命令拦截（`runCommandPolicy.ts`） |
| 2.5-3 | **`AGENT_TOOLS_SYSTEM`**：区分 `search_repo` vs `grep_repo`、截断提示 |
| 2.5-4 | **`MAX_TOOL_OUTPUT`**（32k）导出 + 活动行「输出已截断」标记 |

## 关键文件

- `src/services/agentTools/grepRepoCore.ts`
- `src/services/agentTools/runCommandPolicy.ts`
- `src/services/agentTools/definitions.ts` / `executor.ts`
- `src/services/agentRunner.ts`

## 手动验证

1. Agent 模式 + 工具循环 → 让 AI「grep 搜索 TODO」→ 活动行出现 **内容搜索**。
2. `run_command` 尝试 `rm -rf /` → 应返回 `COMMAND_BLOCKED`。
3. 大输出工具 → 活动行末尾显示「输出已截断」。
