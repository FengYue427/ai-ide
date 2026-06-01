# Release Notes — v1.1.9

**主题**：插件 SDK 2.0（平台 AI + 调试只读 API）  
**版本**：`1.1.9`  
**建议 tag**：`v1.1.9`

---

## 面向用户

### 插件 SDK 2.0

- 插件可读取 **AI 运行模式**：`platform` / `byok` / `ollama` / `unconfigured`
- 插件可读取 **调试会话摘要**（需 `debug:read` 权限）：阶段、是否活动、运行时类型
- **平台 AI** 与主应用一致：已登录 + 平台模式时，`context.ai.complete` 无需用户 API Key

### 官方市场

- 新增示例插件 **「SDK v2 状态」**：工具栏一键查看 AI 模式与调试阶段
- 市场卡片显示 **SDK 2** 标识（`sdkVersion: 2`）

### v1.1.8.x 抛光（同包合入）

- Tab 补全、插件 AI 支持平台网关
- Chat 未登录时提示注册使用平台 AI

---

## 面向插件作者

| API | 权限 | 说明 |
|-----|------|------|
| `context.ai.getMode()` | `ai` | 当前 AI 来源 |
| `context.ai.complete(prompt)` | `ai` | 单轮补全（平台或 BYOK） |
| `context.debug.getSummary()` | `debug:read` | 只读调试摘要 |

文档：[PLUGIN_SDK_V2.md](./PLUGIN_SDK_V2.md)

---

## 升级自 v1.1.8

1. 无需数据库迁移
2. 第三方插件：可选在 manifest 增加 `sdkVersion: 2` 与 `debug:read`
3. 运行 `npm run test:local` 后打 tag `v1.1.9`

---

## 已知限制

- 插件仍不能控制 CDP / 断点（仅只读摘要）
- 无 VSIX、无签名市场审核（v1.2+）
