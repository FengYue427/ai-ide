# 插件 SDK 2.0（v1.1.9）

## Manifest

```json
{
  "manifest": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "...",
    "entry": "function activate(context) { ... }",
    "sdkVersion": 2,
    "permissions": ["editor:read", "ai", "ui"]
  }
}
```

- `sdkVersion`: **2** 表示可使用 v2 API；省略时按 1 处理（兼容旧包）。
- `permissions` 仍使用细粒度 token（见 `pluginPermissions.ts`）。

## AI（与主应用一致）

| API | 说明 |
|-----|------|
| `context.ai.complete(prompt)` | 单轮文本；**平台 AI**（已登录 + 设置选平台）或 **BYOK** |
| `context.ai.getMode()` | `'platform' \| 'byok' \| 'ollama' \| 'unconfigured'` |

未登录且仅平台模式时，`complete` 会抛错（请先注册登录）。

## Debug（只读 · v1.1.7+）

需权限 **`debug:read`**：

| API | 返回 |
|-----|------|
| `context.debug.getSummary()` | `{ active, phase, runtimeKind, syncMode }` |

不包含 CDP 控制（不能代替调试器 UI）。

## IDE 内可见性（v1.1.9.1+）

- **官方市场**与**已安装**列表均显示 `sdkVersion` 徽章。
- 插件面板底部链接至本文档。

## 示例

- [examples/plugins/sdk-v2-status.plugin.json](../examples/plugins/sdk-v2-status.plugin.json)

## 参考

- [PLUGIN_I18N.md](./PLUGIN_I18N.md)
- [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md)（调试器能力）
