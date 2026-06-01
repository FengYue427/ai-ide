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

- [examples/plugins/sdk-v2-status.plugin.json](../examples/plugins/sdk-v2-status.plugin.json) — 含官方 Ed25519 签名样例（`trustTier: verified`）

## 市场签名（v1.2 F3）

当 `VITE_PLUGIN_TRUST_MARKET=true` 时，目录安装会按 `trustTier` 校验：

| trustTier | 策略 |
|-----------|------|
| `official` | 内置目录，跳过签名校验 |
| `verified` | 须 `manifest.signature` 与官方公钥匹配 |
| `community` | 用户二次确认 |
| `unsigned` | 拒绝 |

可选 manifest 字段：`publisher`、`signature: { keyId, value }`。签名载荷为 `{ id, version, permissions, entry, publisher? }` 的稳定 JSON（权限数组排序）。

维护者签名：

```bash
node scripts/sign-plugin-manifest.mjs --generate-key   # 首次，私钥写入 scripts/.plugin-signing-key.json（已 gitignore）
node scripts/sign-plugin-manifest.mjs examples/plugins/sdk-v2-status.plugin.json
```

公钥提交在 `src/lib/pluginTrustOfficialKey.ts`；也可用 `VITE_PLUGIN_OFFICIAL_PUBLIC_KEY` 覆盖。

## 提交审核（v1.2 F4 · 服务端草案）

在服务端设置 `PLUGIN_PUBLISH_ENABLED=true` 后，已登录用户可提交：

```http
POST /api/plugins/publish
Content-Type: application/json

{
  "package": { "manifest": { ... }, "source": "function activate(context) { ... }" }
}
```

成功返回 **202** 与 `{ reviewId, status: "pending", pluginId, version }`。当前为 **人工审核** 队列（日志 + PR 合并进 `PLUGIN_CATALOG`），无自动上架。

## 参考

- [PLUGIN_I18N.md](./PLUGIN_I18N.md)
- [ADR_V1.2_PLUGIN_TRUST.md](./ADR_V1.2_PLUGIN_TRUST.md)
- [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md)（调试器能力）
